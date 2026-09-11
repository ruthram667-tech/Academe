"""Celery application for background tasks and async worker processing."""

import os
from celery import Celery

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

try:
    from app.config import get_settings
    settings = get_settings()
    broker_url = settings.redis_url
    result_backend = settings.redis_url
except ImportError:
    broker_url = REDIS_URL
    result_backend = REDIS_URL

celery_app = Celery(
    "academe",
    broker=broker_url,
    backend=result_backend,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)

# Auto-discover tasks across backend.tasks and app.tasks
celery_app.autodiscover_tasks(["backend.tasks", "app.tasks"])
