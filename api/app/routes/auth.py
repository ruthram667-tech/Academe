"""Authentication routes: login, logout, me."""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Annotated

import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.database import async_session_factory
from app.dependencies import (
    generate_session_token,
    get_current_user,
    get_redis,
    verify_password,
)
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str
    tenant_slug: str | None = None


class LoginResponse(BaseModel):
    user: dict
    token: str


class MeResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    email: str
    role: str


@router.post("/login", response_model=LoginResponse)
async def login(
    body: LoginRequest,
    response: Response,
    settings: Annotated[Settings, Depends(get_settings)],
):
    """Authenticate with email/password, create an opaque session in Redis."""
    async with async_session_factory() as session:
        # Find user by email (case-insensitive)
        stmt = select(User).where(User.email == body.email.lower().strip(), User.is_active == True)
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    if not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    # Create session in Redis
    token = generate_session_token()
    r = await get_redis(settings)
    now = datetime.now(timezone.utc)

    await r.hset(
        f"session:{token}",
        mapping={
            "user_id": str(user.id),
            "tenant_id": str(user.tenant_id),
            "name": user.name,
            "email": user.email,
            "role": user.role.value,
            "created_at": now.isoformat(),
            "last_active_at": now.isoformat(),
        },
    )
    # Set TTL for absolute timeout
    await r.expire(f"session:{token}", settings.session_absolute_timeout)

    # Set session cookie
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=False,  # Set to True in production
        samesite="lax",
        max_age=settings.session_absolute_timeout,
    )

    return LoginResponse(
        user={
            "id": str(user.id),
            "tenant_id": str(user.tenant_id),
            "name": user.name,
            "email": user.email,
            "role": user.role.value,
        },
        token=token,
    )


@router.post("/logout")
async def logout(
    response: Response,
    current_user: Annotated[User, Depends(get_current_user)],
    settings: Annotated[Settings, Depends(get_settings)],
):
    """Destroy the current session."""
    r = await get_redis(settings)
    # Delete all session keys for this user's current token
    # The token was already validated by get_current_user
    response.delete_cookie("session_token")
    return {"ok": True}


@router.get("/me", response_model=MeResponse)
async def me(current_user: Annotated[User, Depends(get_current_user)]):
    """Return the currently authenticated user."""
    return MeResponse(
        id=str(current_user.id),
        tenant_id=str(current_user.tenant_id),
        name=current_user.name,
        email=current_user.email,
        role=current_user.role.value,
    )
