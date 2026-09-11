"""Assignment model — deadlines, grace periods, attempt limits."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, SmallInteger, String, Text, Uuid, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TenantMixin, TimestampMixin


class Assignment(Base, TenantMixin, TimestampMixin):
    __tablename__ = "assignments"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    subject_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False
    )
    section_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("sections.id", ondelete="CASCADE"), nullable=False
    )
    semester_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("semesters.id", ondelete="CASCADE"), nullable=False
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Deadlines — evaluated on server clock only
    opens_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    due_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    grace_minutes: Mapped[int] = mapped_column(SmallInteger, default=0)

    # Submission rules
    max_attempts: Mapped[int] = mapped_column(SmallInteger, default=1)
    allowed_types: Mapped[dict] = mapped_column(
        JSONB, default=["application/pdf", "image/png", "image/jpeg"]
    )
    max_file_size_bytes: Mapped[int] = mapped_column(Integer, default=20 * 1024 * 1024)  # 20 MB

    # Grading config
    enable_blind_marking: Mapped[bool] = mapped_column(default=False)
