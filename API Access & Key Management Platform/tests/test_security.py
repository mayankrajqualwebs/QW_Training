
import jwt

from app.core.config import settings
from app.core.security import (
    create_access_token,
    decode_access_token,
    generate_api_key,
    hash_api_key,
    hash_password,
    verify_password,
)


def test_password_is_hashed_and_verifiable():
    password = "TestPassword!123"
    hashed = hash_password(password)

    assert hashed != password
    assert verify_password(password, hashed)
    assert not verify_password("WrongPassword!123", hashed)


def test_access_token_contains_user_id():
    token = create_access_token("test-user-123")

    payload = decode_access_token(token)

    assert payload["sub"] == "test-user-123"
    assert payload["token_type"] == "access"


def test_invalid_access_token_is_rejected():
    try:
        decode_access_token("not-a-valid-jwt")
        assert False, "Expected invalid token to be rejected"
    except jwt.InvalidTokenError:
        pass


def test_api_key_is_securely_generated():
    key = generate_api_key()

    assert key.startswith("ak_live_")
    assert len(key) > 30


def test_api_key_hash_is_deterministic():
    key = "ak_live_test-secret"

    first_hash = hash_api_key(key)
    second_hash = hash_api_key(key)

    assert first_hash == second_hash
    assert first_hash != key
