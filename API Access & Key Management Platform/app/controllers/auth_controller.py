"""
Authentication Controller
=========================
Handles HTTP requests, input transformation, and response generation for auth endpoints.
"""

from typing import Any
from fastapi import HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.schemas.auth import (
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth_service import AuthService, auth_service
from app.services.exceptions import ConflictError, UnauthorizedError


class AuthController:
    """Controller for user authentication, registration, and session token management."""

    def __init__(self, service: AuthService = auth_service):
        self.service = service

    async def register(self, data: RegisterRequest) -> UserResponse:
        """Handles user registration requests."""
        try:
            return await self.service.register(data)
        except ConflictError as exc:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=exc.message,
            )

    async def login(
        self,
        form_data: OAuth2PasswordRequestForm,
    ) -> TokenResponse:
        """Handles OAuth2 password login requests."""
        try:
            return await self.service.authenticate(
                username_or_email=form_data.username,
                password=form_data.password,
            )
        except UnauthorizedError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=exc.message,
                headers=exc.headers or {"WWW-Authenticate": "Bearer"},
            )

    async def refresh_tokens(self, data: RefreshRequest) -> TokenResponse:
        """Handles refresh token rotation requests."""
        try:
            return await self.service.refresh_tokens(data.refresh_token)
        except UnauthorizedError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=exc.message,
            )

    async def logout(self, data: RefreshRequest) -> None:
        """Handles session logout and token revocation."""
        await self.service.logout(data.refresh_token)
        return None

    def get_me(self, user: Any) -> UserResponse:
        """Returns the profile of the authenticated user."""
        return UserResponse(
            id=user.id,
            email=user.email,
        )


auth_controller = AuthController()
