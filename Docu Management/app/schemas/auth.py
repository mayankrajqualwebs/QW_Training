"""
Authentication Data Schemas
===========================
Defines Pydantic request and response models for user authentication and tokens.

Used by `app/api/auth.py` to automatically validate incoming JSON bodies and
serialize outgoing API responses.
"""

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    """Payload received when creating a new user account."""
    email: EmailStr
    password: str = Field(
        min_length=12,
        max_length=128,
        description="User password, enforced to at least 12 characters for security.",
    )


class UserResponse(BaseModel):
    """Public user profile returned after registration or from the `/auth/me` endpoint."""
    id: str
    email: EmailStr


class RefreshRequest(BaseModel):
    """Payload sent by the client to rotate an existing refresh token or log out."""
    refresh_token: str


class TokenResponse(BaseModel):
    """
    Standard OAuth2-compatible token bundle returned on login or token refresh.
    Contains both the short-lived access token and the rotated refresh token.
    """
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # Lifetime of access_token in seconds