"""
Authentication API Module
=========================
Maintains backward compatibility by forwarding to app.api.routers.auth.
"""

from app.api.routers.auth import (
    get_me,
    login,
    logout,
    refresh_tokens,
    register,
    router,
)

__all__ = [
    "router",
    "register",
    "login",
    "refresh_tokens",
    "logout",
    "get_me",
]
