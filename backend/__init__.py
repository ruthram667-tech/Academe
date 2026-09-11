"""Backend package containing Celery worker app, tasks, and asynchronous services."""

from .celery_app import celery_app

__all__ = ["celery_app"]
