"""
API Repositories Re-export
==========================
Maintains compatibility for imports via app.api.repositories.
"""

from app.repositories import *
from app.repositories import __all__ as _all_repositories

__all__ = list(_all_repositories)
