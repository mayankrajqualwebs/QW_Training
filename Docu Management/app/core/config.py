"""
Application Configuration
=========================
Loads environment variables and application settings using Pydantic Settings.

Reads configuration values from the root `.env` file with fallback defaults.
Ensures critical secrets like DATABASE_URL and JWT_SECRET are present at startup.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Central application settings schema.
    Pydantic automatically validates and type-casts environment variables.
    """

    # General application metadata
    APP_NAME: str = "API Access & Key Management Platform"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # PostgreSQL connection string for Prisma ORM
    DATABASE_URL: str

    # Secret key used for signing and verifying HMAC-SHA256 JWT access tokens
    JWT_SECRET: str

    # Token expiration lifetimes
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15  # Short-lived access token for stateless auth
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7     # Long-lived refresh token stored hashed in DB

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


# Singleton settings instance accessed throughout the backend
settings = Settings()