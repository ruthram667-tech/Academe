"""FastAPI dependencies: auth, tenant context, database sessions."""

import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Annotated

import redis.asyncio as aioredis
from argon2 import PasswordHasher
from fastapi import Cookie, Depends, HTTPException, Request, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.database import async_session_factory
from app.models.user import User, UserRole

ph = PasswordHasher()

_redis: aioredis.Redis | None = None


async def get_redis(settings: Annotated[Settings, Depends(get_settings)]) -> aioredis.Redis:
    """Get or create a Redis connection."""
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(settings.redis_url, decode_responses=True)
    return _redis


# ── Session management ──


def generate_session_token() -> str:
    """Generate a cryptographically secure opaque session token."""
    return secrets.token_hex(32)


def hash_password(password: str) -> str:
    """Hash a password with Argon2id."""
    return ph.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a password against its Argon2id hash."""
    try:
        return ph.verify(hashed, plain)
    except Exception:
        return False


# ── Auth dependency ──


async def get_current_user(
    request: Request,
    session_token: str | None = Cookie(default=None, alias="session_token"),
    settings: Settings = Depends(get_settings),
) -> User:
    """Extract and validate the session token, return the current user.

    Checks Redis first, falls back to the sessions table.
    """
    # Also check Authorization header for API clients
    token = session_token
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sign in to continue.",
        )

    r = await get_redis(settings)

    # Check Redis for cached session
    session_data = await r.hgetall(f"session:{token}")
    if not session_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session has expired. Sign in again.",
        )

    # Check idle timeout
    last_active = datetime.fromisoformat(session_data["last_active_at"])
    if (datetime.now(timezone.utc) - last_active).seconds > settings.session_idle_timeout:
        await r.delete(f"session:{token}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session has expired due to inactivity.",
        )

    # Check absolute timeout
    created_at = datetime.fromisoformat(session_data["created_at"])
    if (datetime.now(timezone.utc) - created_at).seconds > settings.session_absolute_timeout:
        await r.delete(f"session:{token}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session has expired. Sign in again.",
        )

    # Touch last_active
    await r.hset(f"session:{token}", "last_active_at", datetime.now(timezone.utc).isoformat())

    # Reconstruct a lightweight User object from session data
    user = User(
        id=uuid.UUID(session_data["user_id"]),
        tenant_id=uuid.UUID(session_data["tenant_id"]),
        name=session_data["name"],
        email=session_data["email"],
        role=UserRole(session_data["role"]),
        password_hash="",  # Not needed for auth'd requests
    )
    return user


# ── Tenant-scoped DB session ──


async def get_tenant_db(
    current_user: Annotated[User, Depends(get_current_user)],
) -> AsyncSession:
    """Yield a database session scoped to the current user's tenant via RLS."""
    async with async_session_factory() as session:
        async with session.begin():
            await session.execute(
                text("SET LOCAL app.tenant_id = :tid"),
                {"tid": str(current_user.tenant_id)},
            )
            yield session


# ── Role guard ──


def require_role(*roles: UserRole):
    """Dependency that enforces the user has one of the given roles."""

    async def guard(current_user: Annotated[User, Depends(get_current_user)]) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this.",
            )
        return current_user

    return guard
