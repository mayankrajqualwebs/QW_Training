"""
Security and Cryptography Utilities
===================================
Provides cryptographic hashing, JWT handling, and API key generation.

Key responsibilities:
1. User password hashing and verification using industry-standard algorithms (via pwdlib).
2. Stateless JWT access token generation and verification for session management.
3. Cryptographically random refresh token generation and SHA-256 hashing.
4. Secure API key generation (`ak_live_...`) and one-way SHA-256 hashing before DB storage.
"""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash

from app.core.config import settings

# Initialize recommended password hashing algorithm (Argon2 / bcrypt)
password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    """Hashes a plaintext password using a salted, slow cryptographic hash."""
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    """Verifies a plaintext password against an existing hash."""
    return password_hash.verify(password, hashed_password)


def create_access_token(user_id: str) -> str:
    """
    Creates a signed, short-lived JWT access token for API session authentication.
    
    Inputs:
        user_id: The unique identifier of the authenticated user.
    Outputs:
        An encoded JWT string containing the user ID in the 'sub' claim.
    """
    now = datetime.now(timezone.utc)

    payload = {
        "sub": user_id,
        "token_type": "access",
        "iat": now,
        "exp": now + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        ),
    }

    return jwt.encode(
        payload,
        settings.JWT_SECRET,
        algorithm="HS256",
    )


def create_refresh_token() -> str:
    """
    Generates a cryptographically random, high-entropy URL-safe refresh token.
    The raw token is returned to the user, while only its SHA-256 hash is saved in DB.
    """
    return secrets.token_urlsafe(48)


def hash_refresh_token(token: str) -> str:
    """
    Computes the SHA-256 hash of a refresh token.
    Ensures that if the database is ever compromised, stored refresh tokens cannot be used.
    """
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def decode_access_token(token: str) -> dict:
    """
    Decodes and validates a JWT access token.
    
    Checks signature against settings.JWT_SECRET and verifies standard claims:
    - Token must not be expired ('exp')
    - Token type must be 'access'
    - Subject ('sub' / user_id) must be present
    
    Raises:
        jwt.InvalidTokenError: If expired, invalid signature, or wrong structure.
    """
    payload = jwt.decode(
        token,
        settings.JWT_SECRET,
        algorithms=["HS256"],
    )

    if payload.get("token_type") != "access":
        raise jwt.InvalidTokenError("Invalid token type")

    if not payload.get("sub"):
        raise jwt.InvalidTokenError("Missing subject")

    return payload


def generate_api_key() -> str:
    """
    Generates a cryptographically secure, standard-formatted API key.
    Format: `ak_live_<random_bytes>` (e.g. ak_live_3vK...).
    """
    return f"ak_live_{secrets.token_urlsafe(32)}"


def hash_api_key(api_key: str) -> str:
    """
    Hashes an API key using SHA-256 before database lookup or storage.
    The database never stores plaintext API keys, preventing credential theft.
    """
    return hashlib.sha256(api_key.encode("utf-8")).hexdigest()