"""
FastAPI middleware for session authentication.
Extracts user_id from session cookie or Authorization header.
"""

from fastapi import Request, HTTPException
from typing import Optional, Callable, Any
import logging
import json

logger = logging.getLogger(__name__)


class AuthMiddleware:
    """
    Middleware to extract and validate session information.
    Looks for session in:
    1. Authorization header (Bearer <user_id>)
    2. next-auth.session-token cookie
    3. Session cookie
    """

    def __init__(self, app: Any):
        self.app = app

    async def __call__(self, request: Request, call_next: Callable) -> Any:
        """Process request and extract session info."""
        # Extract user_id from request
        request.state.user_id = self._extract_user_id(request)
        
        response = await call_next(request)
        return response

    def _extract_user_id(self, request: Request) -> Optional[str]:
        """
        Extract user_id from request.
        
        Returns:
            user_id if found, None otherwise
        """
        # Try Authorization header first
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            user_id = auth_header[7:]  # Remove "Bearer "
            if user_id:
                logger.debug(f"[AUTH] User ID from Authorization header: {user_id}")
                return user_id

        # Try next-auth session token cookie
        session_token = request.cookies.get("next-auth.session-token")
        if session_token:
            try:
                # For NextAuth.js, we'll validate via the session endpoint
                logger.debug(f"[AUTH] NextAuth session token found")
                # In production, verify this token - for now we trust NextAuth
                # The actual user_id will be extracted in the route handler
                return session_token
            except Exception as e:
                logger.error(f"[AUTH] Failed to parse session token: {e}")

        # Try generic session cookie
        session_cookie = request.cookies.get("session")
        if session_cookie:
            try:
                session_data = json.loads(session_cookie)
                user_id = session_data.get("user_id")
                if user_id:
                    logger.debug(f"[AUTH] User ID from session cookie: {user_id}")
                    return user_id
            except Exception as e:
                logger.error(f"[AUTH] Failed to parse session cookie: {e}")

        logger.debug("[AUTH] No session found in request")
        return None


def require_auth(func: Callable) -> Callable:
    """
    Decorator to require authentication on a route.
    Raises 401 if no valid session found.
    """
    async def wrapper(request: Request, *args: Any, **kwargs: Any) -> Any:
        if not request.state.user_id:
            logger.warning("[AUTH] Unauthorized request to protected endpoint")
            raise HTTPException(status_code=401, detail="Unauthorized")
        return await func(request, *args, **kwargs)
    return wrapper


def get_user_id(request: Request) -> Optional[str]:
    """Extract user_id from request state."""
    return getattr(request.state, "user_id", None)
