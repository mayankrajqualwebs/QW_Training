"""
API Key Module
==============
Maintains backward compatibility by forwarding to app.api.routers.api_keys.
"""

from app.api.routers.api_keys import (
    create_api_key,
    list_api_keys,
    revoke_api_key,
    router,
)
from app.services.api_key_service import ALLOWED_SCOPES, KEY_CREATION_ROLES, to_api_key_response

__all__ = [
    "router",
    "create_api_key",
    "list_api_keys",
    "revoke_api_key",
    "to_api_key_response",
    "ALLOWED_SCOPES",
    "KEY_CREATION_ROLES",
]
