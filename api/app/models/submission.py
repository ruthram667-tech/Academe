"""Submission attempt model — immutable, versioned, never updated in place."""

import enum
import uuid
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, SmallInteger, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantMixin


class ScanStatus(str, enum.Enum):
    PENDING = "pending"
    CLEAN = "clean"
    INFECTED = "infected"


class SubmissionAttempt(Base, TenantMixin):
    """Each submission is an immutable attempt. No UPDATE policy on this table.

    Resubmissions create a new row with an incremented attempt_no.
    Deadlines are evaluated on the server clock — is_late is computed at insert.
    """

    __tablename__ = "submission_attempts"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    assignment_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    attempt_no: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    is_late: Mapped[bool] = mapped_column(default=False)

    # File metadata
    file_key: Mapped[str] = mapped_column(Text, nullable=False)  # MinIO object key
    original_name: Mapped[str] = mapped_column(String(500), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    checksum_sha256: Mapped[str] = mapped_column(String(64), nullable=False)

    # Virus scan status — file stays quarantined until CLEAN
    scan_status: Mapped[ScanStatus] = mapped_column(
        Enum(ScanStatus, native_enum=False), default=ScanStatus.PENDING
    )

    # Idempotency: reject duplicate submits from double-taps
    idempotency_key: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)

    # No UPDATE or DELETE — this table is append-only for integrity.
