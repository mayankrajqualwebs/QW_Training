"""
Authentication API Router
=========================
Defines HTTP routes for user registration, login, token rotation, and profile inspection.
Delegates execution to AuthController.
"""

from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm

from app.controllers.auth_controller import auth_controller
from app.core.dependencies import get_current_user
from app.schemas.auth import (
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(data: RegisterRequest):
    """
    Creates a new user account.
    Validates input schema and enforces unique email constraint.
    """
    return await auth_controller.register(data)


@router.post(
    "/login",
    response_model=TokenResponse,
)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Authenticates a user via OAuth2 password flow and issues an access/refresh token pair.
    """
    return await auth_controller.login(form_data)


@router.post(
    "/refresh",
    response_model=TokenResponse,
)
async def refresh_tokens(data: RefreshRequest):
    """
    Refreshes an expired access token using single-use refresh token rotation.
    """
    return await auth_controller.refresh_tokens(data)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def logout(data: RefreshRequest):
    """
    Revokes the supplied refresh token to invalidate the session.
    """
    return await auth_controller.logout(data)


@router.get(
    "/me",
    response_model=UserResponse,
)
async def get_me(user=Depends(get_current_user)):
    """
    Returns authenticated user profile information.
    Protected by Bearer JWT authentication dependency.
    """
    return auth_controller.get_me(user)
