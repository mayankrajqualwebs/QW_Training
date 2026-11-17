"""
Application Configuration
=========================
Loads environment variables and application settings using Pydantic Settings.
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

    # PostgreSQL connection
    DATABASE_URL: str

    # JWT Authentication
    JWT_SECRET: str

    # Token expiration
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # AWS S3 Configuration
    AWS_REGION: str | None = None
    AWS_S3_BUCKET: str | None = None
    AWS_PROFILE: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


# Singleton settings instance
settings = Settings()
