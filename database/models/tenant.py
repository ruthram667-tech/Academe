"""Tenant model — the root entity for multi-tenancy."""

import uuid
from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class Tenant(Base):
    __tablename__ = "tenants"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    domain: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    logo_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Limits
    max_students: Mapped[int] = mapped_column(default=500)
    storage_quota_bytes: Mapped[int] = mapped_column(BigInteger, default=10 * 1024**3)  # 10 GB

    # Config
    register_number_format: Mapped[str] = mapped_column(
        String(100), default="{year}{dept}{seq:04d}"
    )

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
