"""
User Authentication Dependencies
=================================
Provides FastAPI dependency injection functions for authenticating platform users.

Request Flow:
1. Client sends HTTP request with header: `Authorization: Bearer <jwt_access_token>`.
2. `oauth2_scheme` extracts the bearer token from the header.
3. `get_current_user` decodes and verifies the token signature and expiration.
4. Queries Prisma to ensure the user still exists in the database.
5. Injects the active User database record into the calling route handler.
"""

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.security import decode_access_token
from app.repositories.user_repository import user_repository

# Tells FastAPI that this scheme reads Bearer tokens, pointing docs to /auth/login
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
):
    """
    FastAPI dependency that enforces authentication for protected dashboard endpoints.
    
    Validates the JWT access token and fetches the corresponding User from the database.
    
    Returns:
        User: The authenticated User object from Prisma.
    Raises:
        HTTPException (401): If token is missing, expired, invalid, or user was deleted.
    """
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired access token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Decode token and extract the user's ID stored in the 'sub' (subject) claim
        payload = decode_access_token(token)
        user_id = payload["sub"]
    except (jwt.InvalidTokenError, KeyError):
        raise credentials_error

    # Ensure the user exists in PostgreSQL
    user = await user_repository.get_by_id(user_id)

    if user is None:
        raise credentials_error

    return user