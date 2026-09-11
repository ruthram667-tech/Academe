"""Backward-compatible database module forwarding to database package."""

try:
    from database.connection import (
        engine,
        async_session_factory,
        get_session,
        get_tenant_session,
    )
except ImportError:
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
        async with async_session_factory() as session:
            async with session.begin():
                await session.execute(
                    text("SET LOCAL app.tenant_id = :tid"),
                    {"tid": str(tenant_id)},
                )
                yield session

    async def get_session() -> AsyncGenerator[AsyncSession, None]:
        async with async_session_factory() as session:
            async with session.begin():
                yield session

__all__ = ["engine", "async_session_factory", "get_session", "get_tenant_session"]
