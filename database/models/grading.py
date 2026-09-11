"""Grading models — rubrics, criteria, and append-only grade events."""

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, SmallInteger, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TenantMixin, TimestampMixin


class Rubric(Base, TenantMixin, TimestampMixin):
    __tablename__ = "rubrics"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    assignment_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    max_marks: Mapped[float] = mapped_column(Numeric(6, 2), nullable=False)


class RubricCriterion(Base, TenantMixin):
    __tablename__ = "rubric_criteria"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    rubric_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("rubrics.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    max_marks: Mapped[float] = mapped_column(Numeric(6, 2), nullable=False)
    order: Mapped[int] = mapped_column(SmallInteger, default=0)


class GradeEventType(str, enum.Enum):
    DRAFT = "draft"
    PUBLISH = "publish"
    REGRADE = "regrade"
    MODERATION = "moderation"


class GradeEvent(Base, TenantMixin):
    """Append-only grade event log. History IS the feature.

    No UPDATE or DELETE. Any mark's full history can be reconstructed
    by querying grade_events in chronological order.
    """

    __tablename__ = "grade_events"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    submission_attempt_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("submission_attempts.id", ondelete="CASCADE"), nullable=False
    )
    criterion_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("rubric_criteria.id", ondelete="SET NULL"), nullable=True
    )
    actor_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=False
    )

    event_type: Mapped[GradeEventType] = mapped_column(
        Enum(GradeEventType, native_enum=False), nullable=False
    )
    old_value: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    new_value: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
