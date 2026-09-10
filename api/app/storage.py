"""MinIO / S3-compatible object storage helper."""

import uuid
from datetime import timedelta

from minio import Minio

from app.config import get_settings

settings = get_settings()

_client: Minio | None = None


def get_minio_client() -> Minio:
    global _client
    if _client is None:
        _client = Minio(
            endpoint=settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=settings.minio_use_ssl,
        )
    return _client


def ensure_bucket() -> None:
    """Create the upload bucket if it doesn't exist."""
    client = get_minio_client()
    if not client.bucket_exists(settings.minio_bucket):
        client.make_bucket(settings.minio_bucket)


def generate_upload_key(tenant_id: uuid.UUID, filename: str) -> str:
    """Generate a unique object key scoped to a tenant."""
    unique = uuid.uuid4().hex[:12]
    return f"{tenant_id}/{unique}/{filename}"


def presigned_put_url(object_key: str, expires: timedelta = timedelta(minutes=15)) -> str:
    """Generate a presigned URL for uploading a file directly to MinIO."""
    client = get_minio_client()
    return client.presigned_put_object(
        bucket_name=settings.minio_bucket,
        object_name=object_key,
        expires=expires,
    )


def presigned_get_url(object_key: str, expires: timedelta = timedelta(seconds=60)) -> str:
    """Generate a short-lived presigned URL for downloading a file."""
    client = get_minio_client()
    return client.presigned_get_object(
        bucket_name=settings.minio_bucket,
        object_name=object_key,
        expires=expires,
    )


def delete_object(object_key: str) -> None:
    """Delete an object from MinIO."""
    client = get_minio_client()
    client.remove_object(settings.minio_bucket, object_key)
