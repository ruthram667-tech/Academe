"""SQLAlchemy 2.0 async engine, session factory, and tenant-aware base."""

import uuid
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@asynccontextmanager
async def get_tenant_session(tenant_id: uuid.UUID) -> AsyncGenerator[AsyncSession, None]:
    """Yield a session with RLS tenant context set.

    Every query executed through this session will be scoped to the given
    tenant by Postgres Row-Level Security policies.
    """
    async with async_session_factory() as session:
        async with session.begin():
            # SET LOCAL scopes to the current transaction only
            await session.execute(
                text("SET LOCAL app.tenant_id = :tid"),
                {"tid": str(tenant_id)},
            )
            yield session


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Yield a plain session without tenant scoping (for super-admin / system tasks)."""
    async with async_session_factory() as session:
        async with session.begin():
            yield session
