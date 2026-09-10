"""Health check endpoints."""

from fastapi import APIRouter
from sqlalchemy import text

from app.database import async_session_factory

router = APIRouter(tags=["health"])


@router.get("/healthz")
async def healthz():
    """Liveness probe — is the process running?"""
    return {"status": "ok"}


@router.get("/readyz")
async def readyz():
    """Readiness probe — can the app serve traffic?"""
    try:
        async with async_session_factory() as session:
            await session.execute(text("SELECT 1"))
        return {"status": "ready"}
    except Exception as e:
        return {"status": "not_ready", "detail": str(e)}
