"""
Service Domain Exceptions
=========================
Defines domain and business logic exceptions that are decoupled from HTTP transport.
These exceptions are caught and mapped to HTTP responses by the Controller layer.
"""

from typing import Any, Optional


class ServiceError(Exception):
    """Base class for all business logic and service-layer exceptions."""

    def __init__(self, message: Any = "A service error occurred", detail: Any = None):
        payload = detail if detail is not None else message
        super().__init__(payload)
        self.message = payload
        self.detail = payload


class NotFoundError(ServiceError):
    """Raised when a requested resource does not exist."""
    pass


class ConflictError(ServiceError):
    """Raised when a resource uniqueness constraint is violated."""
    pass


class ForbiddenError(ServiceError):
    """Raised when an authenticated caller lacks authorization for an action."""
    pass


class UnauthorizedError(ServiceError):
    """Raised when credentials are invalid, expired, or missing."""

    def __init__(
        self,
        message: str = "Unauthorized",
        headers: Optional[dict[str, str]] = None,
    ):
        super().__init__(message)
        self.headers = headers or {}


class ValidationError(ServiceError):
    """Raised when input fails business rules validation."""
    pass


class ServiceUnavailableError(ServiceError):
    """Raised when an external or downstream dependency is unavailable."""
    pass
