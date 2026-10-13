"""
User Repository
===============
Handles database queries and data persistence for the User model.
"""

from typing import Optional
from prisma.models import User
from app.db.client import prisma


class UserRepository:
    """Repository handling database operations for User records."""

    async def get_by_id(self, user_id: str) -> Optional[User]:
        """Fetch a user record by primary key."""
        return await prisma.user.find_unique(where={"id": user_id})

    async def get_by_email(self, email: str) -> Optional[User]:
        """Fetch a user record by unique email."""
        return await prisma.user.find_unique(where={"email": email.lower()})

    async def create(self, email: str, password_hash: str) -> User:
        """Create and persist a new user record."""
        return await prisma.user.create(
            data={
                "email": email.lower(),
                "passwordHash": password_hash,
            }
        )


user_repository = UserRepository()
