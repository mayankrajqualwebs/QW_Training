"""
Root ASGI Entrypoint Proxy
===========================
Re-exports the FastAPI `app` instance from `app.main`.

Allows launching the server using either:
    python -m uvicorn main:app --reload
or:
    python -m uvicorn app.main:app --reload
from the project root directory.
"""

from app.main import app

__all__ = ["app"]
