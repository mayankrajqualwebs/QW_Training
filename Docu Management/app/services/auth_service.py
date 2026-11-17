"""
Authentication Service
======================
Business logic for registration, authentication, token issuance, and rotation.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.repositories.refresh_token_repository import (
    RefreshTokenRepository,
    refresh_token_repository,
)
from app.repositories.user_repository import (
    UserRepository,
    user_repository,
)
from app.schemas.auth import (
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services.exceptions import (
    ConflictError,
    UnauthorizedError,
)


class AuthService:
    """Service handling user accounts, authentication sessions, and token rotation."""

    def __init__(
        self,
        user_repo: UserRepository = user_repository,
        token_repo: RefreshTokenRepository = refresh_token_repository,
    ):
        self.user_repo = user_repo
        self.token_repo = token_repo

    def get_refresh_expiry(self) -> datetime:
        """Calculates expiration timestamp for newly issued refresh tokens."""
        return datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )

    async def register(self, data: RegisterRequest) -> UserResponse:
        """
        Registers a new user account.
        Enforces unique email check and password hashing.
        """
        email = str(data.email).lower()

        existing_user = await self.user_repo.get_by_email(email)
        if existing_user is not None:
            raise ConflictError("An account with this email already exists")

        user = await self.user_repo.create(
            email=email,
            password_hash=hash_password(data.password),
        )

        return UserResponse(
            id=user.id,
            email=user.email,
        )

    async def authenticate(
        self,
        username_or_email: str,
        password: str,
    ) -> TokenResponse:
        """
        Authenticates user credentials and issues a fresh JWT and refresh token pair.
        """
        email = username_or_email.lower()
        user = await self.user_repo.get_by_email(email)

        if user is None or not verify_password(password, user.passwordHash):
            raise UnauthorizedError(
                message="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return await self.issue_tokens(user.id)

    async def issue_tokens(self, user_id: str) -> TokenResponse:
        """
        Issues signed JWT access token and saves cryptographically hashed refresh token.
        """
        access_token = create_access_token(user_id)
        refresh_token = create_refresh_token()

        await self.token_repo.create(
            token_hash=hash_refresh_token(refresh_token),
            user_id=user_id,
            expires_at=self.get_refresh_expiry(),
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def refresh_tokens(self, raw_refresh_token: str) -> TokenResponse:
        """
        Implements single-use refresh token rotation:
        validates the token, revokes it, and issues a fresh token bundle.
        """
        token_hash = hash_refresh_token(raw_refresh_token)
        stored_token = await self.token_repo.get_by_hash(token_hash)

        now = datetime.now(timezone.utc)

        if (
            stored_token is None
            or stored_token.revokedAt is not None
            or stored_token.expiresAt <= now
        ):
            raise UnauthorizedError("Invalid or expired refresh token")

        # Invalidate old token to prevent replay attacks
        await self.token_repo.revoke(stored_token.id, revoked_at=now)

        return await self.issue_tokens(stored_token.userId)

    async def logout(self, raw_refresh_token: str) -> None:
        """Revokes the given refresh token in the database."""
        token_hash = hash_refresh_token(raw_refresh_token)
        stored_token = await self.token_repo.get_by_hash(token_hash)

        if stored_token is not None and stored_token.revokedAt is None:
            await self.token_repo.revoke(
                stored_token.id,
                revoked_at=datetime.now(timezone.utc),
            )


auth_service = AuthService()
