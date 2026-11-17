"""
Database Client Module
======================
Initializes and exports the singleton Prisma client instance.

Prisma is the ORM used to interact with PostgreSQL. The connection lifecycle
(connecting on startup and disconnecting on shutdown) is managed in `app/main.py`
using FastAPI's lifespan context manager.
"""

from prisma import Prisma

# Global singleton Prisma client used across all route handlers and services.
prisma = Prisma()