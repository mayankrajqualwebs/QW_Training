"""
Secure Secret Delivery Manager
==============================
Handles end-to-end encrypted, temporary storage of API key secrets for secure delivery
and one-time reveal to assigned users.

Security Principles:
1. Encryption-at-Rest: Raw secrets are never stored in plaintext on disk or in the database.
   They are encrypted with symmetric authenticated encryption (Fernet AES-128-CBC + HMAC-SHA256)
   using a key derived from the application's JWT_SECRET.
2. One-Time Reveal: Once an authorized user reveals and copies their key, the delivery record
   is permanently marked as burned (`revealed_at = now`), and the secret cannot be retrieved again.
3. Time-Limited Window: Secrets are automatically invalidated after a configurable TTL (default 72 hours).
4. Ownership Isolation: Secrets can only be decrypted and retrieved by the user explicitly assigned
   to the API key.
"""

import base64
import hashlib
import json
import os
import threading
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import settings


class SecretDeliveryError(Exception):
    """Base exception for secret delivery operations."""
    pass


class SecretAlreadyRevealedError(SecretDeliveryError):
    """Raised when an API key secret has already been retrieved."""
    pass


class SecretDeliveryExpiredError(SecretDeliveryError):
    """Raised when the secure reveal window has expired."""
    pass


class SecretDeliveryNotFoundError(SecretDeliveryError):
    """Raised when no delivery record exists for the given key and user."""
    pass


class SecretDeliveryManager:
    """
    Thread-safe manager for encrypted temporary secret packages.
    Maintains an in-memory dictionary synchronized with a local secure JSON file.
    """

    def __init__(self, storage_path: Optional[str] = None):
        self._lock = threading.Lock()
        self._storage_path = storage_path or os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            ".secret_delivery_store.json",
        )
        self._fernet = self._init_cipher()
        self._store: dict[str, dict[str, Any]] = {}
        self._load_from_disk()

    def _init_cipher(self) -> Fernet:
        """Derives a 32-byte urlsafe base64-encoded key from the JWT_SECRET."""
        digest = hashlib.sha256(settings.JWT_SECRET.encode("utf-8")).digest()
        key = base64.urlsafe_b64encode(digest)
        return Fernet(key)

    def _load_from_disk(self) -> None:
        """Loads encrypted packets from disk if file exists."""
        if not os.path.exists(self._storage_path):
            return

        try:
            with open(self._storage_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, dict):
                    self._store = data
        except Exception:
            # If corrupted or unreadable, start clean
            self._store = {}

    def _save_to_disk(self) -> None:
        """Persists the store to disk atomically."""
        try:
            temp_path = f"{self._storage_path}.tmp"
            with open(temp_path, "w", encoding="utf-8") as f:
                json.dump(self._store, f, indent=2)
            os.replace(temp_path, self._storage_path)
        except Exception:
            pass

    def store_secret(
        self,
        api_key_id: str,
        user_id: str,
        raw_secret: str,
        ttl_hours: int = 72,
    ) -> None:
        """
        Encrypts and stores a raw API key secret for delivery to the assigned user.
        """
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(hours=ttl_hours)

        encrypted_token = self._fernet.encrypt(raw_secret.encode("utf-8")).decode("utf-8")

        with self._lock:
            self._store[api_key_id] = {
                "api_key_id": api_key_id,
                "user_id": user_id,
                "encrypted_secret": encrypted_token,
                "created_at": now.isoformat(),
                "expires_at": expires_at.isoformat(),
                "revealed_at": None,
            }
            self._save_to_disk()

    def can_reveal(self, api_key_id: str, user_id: str) -> bool:
        """
        Checks whether an API key has a pending, unrevealed, unexpired secret
        assigned to the given user.
        """
        with self._lock:
            packet = self._store.get(api_key_id)
            if not packet:
                return False

            if packet.get("user_id") != user_id:
                return False

            if packet.get("revealed_at") is not None:
                return False

            expires_str = packet.get("expires_at")
            if expires_str:
                try:
                    expires_at = datetime.fromisoformat(expires_str)
                    if expires_at.tzinfo is None:
                        expires_at = expires_at.replace(tzinfo=timezone.utc)
                    if datetime.now(timezone.utc) >= expires_at:
                        return False
                except Exception:
                    return False

            return True

    def get_reveal_info(self, api_key_id: str, user_id: str) -> dict[str, Any]:
        """
        Returns public delivery status for an API key without revealing secrets.
        """
        with self._lock:
            packet = self._store.get(api_key_id)
            if not packet or packet.get("user_id") != user_id:
                return {"can_reveal": False, "reveal_expires_at": None}

            is_revealed = packet.get("revealed_at") is not None
            expires_str = packet.get("expires_at")
            expires_at = None
            is_expired = False

            if expires_str:
                try:
                    expires_at = datetime.fromisoformat(expires_str)
                    if expires_at.tzinfo is None:
                        expires_at = expires_at.replace(tzinfo=timezone.utc)
                    is_expired = datetime.now(timezone.utc) >= expires_at
                except Exception:
                    pass

            can_reveal = (not is_revealed) and (not is_expired)
            return {
                "can_reveal": can_reveal,
                "reveal_expires_at": expires_at,
            }

    def reveal_secret(self, api_key_id: str, user_id: str) -> str:
        """
        Retrieves and decrypts the raw secret for the assigned user,
        permanently burning the packet so it cannot be revealed again.
        """
        with self._lock:
            packet = self._store.get(api_key_id)
            if not packet:
                raise SecretDeliveryNotFoundError(
                    "API key secret delivery packet not found."
                )

            if packet.get("user_id") != user_id:
                raise SecretDeliveryNotFoundError(
                    "You are not authorized to reveal this API key secret."
                )

            if packet.get("revealed_at") is not None:
                raise SecretAlreadyRevealedError(
                    "This API key secret has already been revealed and can no longer be retrieved."
                )

            expires_str = packet.get("expires_at")
            if expires_str:
                try:
                    expires_at = datetime.fromisoformat(expires_str)
                    if expires_at.tzinfo is None:
                        expires_at = expires_at.replace(tzinfo=timezone.utc)
                    if datetime.now(timezone.utc) >= expires_at:
                        raise SecretDeliveryExpiredError(
                            "The secure reveal window for this API key has expired."
                        )
                except (ValueError, TypeError):
                    pass

            # Decrypt secret
            encrypted_token = packet.get("encrypted_secret", "")
            try:
                raw_bytes = self._fernet.decrypt(encrypted_token.encode("utf-8"))
                raw_secret = raw_bytes.decode("utf-8")
            except (InvalidToken, Exception) as exc:
                raise SecretDeliveryError("Failed to decrypt API key secret.") from exc

            # Burn delivery immediately
            packet["revealed_at"] = datetime.now(timezone.utc).isoformat()
            # Clear ciphertext to free memory and prevent any future decryption
            packet["encrypted_secret"] = ""
            self._save_to_disk()

            return raw_secret

    def revoke_secret(self, api_key_id: str) -> None:
        """Permanently invalidates and removes any pending secret for an API key."""
        with self._lock:
            if api_key_id in self._store:
                self._store[api_key_id]["revealed_at"] = datetime.now(timezone.utc).isoformat()
                self._store[api_key_id]["encrypted_secret"] = ""
                self._save_to_disk()


# Global singleton manager instance
secret_delivery_manager = SecretDeliveryManager()
