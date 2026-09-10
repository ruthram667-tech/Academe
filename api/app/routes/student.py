"""Student routes: subjects, submissions (presigned upload), quota, grades."""

import hashlib
import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_tenant_db, require_role
from app.models.user import User, UserRole
from app.models.academic import Subject, StaffSubjectAssignment, Enrollment
from app.models.assignment import Assignment
from app.models.submission import SubmissionAttempt, ScanStatus
from app.models.grading import GradeEvent, GradeEventType
from app.policies import require
from app.storage import generate_upload_key, presigned_put_url, presigned_get_url

router = APIRouter(prefix="/student", tags=["student"])

StudentUser = Annotated[User, Depends(require_role(UserRole.STUDENT))]


@router.get("/subjects")
async def get_my_subjects(
    student: StudentUser,
    db: Annotated[AsyncSession, Depends(get_tenant_db)],
):
    """Get subjects the current student is enrolled in."""
    require(student, "view", "own_submissions")
    result = await db.execute(
        select(Subject)
        .join(Enrollment, Enrollment.section_id == Enrollment.section_id)
        .where(Enrollment.student_id == student.id, Enrollment.is_active == True)
        .distinct()
        .order_by(Subject.name)
    )
    subjects = result.scalars().all()
    return [{"id": str(s.id), "name": s.name, "code": s.code} for s in subjects]


@router.get("/assignments")
async def get_assignments(
    student: StudentUser,
    db: Annotated[AsyncSession, Depends(get_tenant_db)],
    subject_id: str | None = None,
):
    """Get assignments for the student's enrolled subjects."""
    require(student, "view", "own_submissions")
    now = datetime.now(timezone.utc)

    stmt = select(Assignment).where(Assignment.opens_at <= now)
    if subject_id:
        stmt = stmt.where(Assignment.subject_id == uuid.UUID(subject_id))
    stmt = stmt.order_by(Assignment.due_at.desc())

    result = await db.execute(stmt)
    assignments = result.scalars().all()
    return [
        {
            "id": str(a.id),
            "title": a.title,
            "description": a.description,
            "subject_id": str(a.subject_id),
            "opens_at": a.opens_at.isoformat(),
            "due_at": a.due_at.isoformat(),
            "grace_minutes": a.grace_minutes,
            "max_attempts": a.max_attempts,
        }
        for a in assignments
    ]


@router.get("/quota")
async def get_quota(
    student: StudentUser,
    db: Annotated[AsyncSession, Depends(get_tenant_db)],
):
    """Get storage usage and quota for the current student."""
    require(student, "view", "own_submissions")

    # Calculate used bytes from submission attempts
    result = await db.execute(
        select(func.coalesce(func.sum(SubmissionAttempt.size_bytes), 0)).where(
            SubmissionAttempt.student_id == student.id
        )
    )
    used = result.scalar_one()
    return {
        "used_bytes": int(used),
        "quota_bytes": student.quota_bytes,
        "used_pct": round(int(used) / student.quota_bytes * 100, 1) if student.quota_bytes else 0,
    }


# ── Presigned upload flow ──


class RequestUploadRequest(BaseModel):
    assignment_id: str
    filename: str
    mime_type: str
    size_bytes: int
    idempotency_key: str


class RequestUploadResponse(BaseModel):
    upload_url: str
    object_key: str


@router.post("/submissions/request-upload", response_model=RequestUploadResponse)
async def request_upload(
    body: RequestUploadRequest,
    student: StudentUser,
    db: Annotated[AsyncSession, Depends(get_tenant_db)],
):
    """Get a presigned upload URL. Client uploads directly to MinIO."""
    require(student, "submit", "assignment")

    # Check assignment exists and is open
    assignment = await db.get(Assignment, uuid.UUID(body.assignment_id))
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found.")

    now = datetime.now(timezone.utc)
    if now < assignment.opens_at:
        raise HTTPException(status_code=400, detail="This assignment is not open yet.")

    # Check file type is allowed
    if body.mime_type not in (assignment.allowed_types or []):
        raise HTTPException(status_code=415, detail="This file type is not accepted.")

    # Check file size
    if body.size_bytes > assignment.max_file_size_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds the {assignment.max_file_size_bytes // (1024*1024)} MB limit.",
        )

    # Check quota
    used_result = await db.execute(
        select(func.coalesce(func.sum(SubmissionAttempt.size_bytes), 0)).where(
            SubmissionAttempt.student_id == student.id
        )
    )
    used = int(used_result.scalar_one())
    if used + body.size_bytes > student.quota_bytes:
        raise HTTPException(
            status_code=413,
            detail="This upload would exceed your storage quota.",
        )

    # Check attempt count
    attempt_count_result = await db.execute(
        select(func.count()).where(
            SubmissionAttempt.assignment_id == uuid.UUID(body.assignment_id),
            SubmissionAttempt.student_id == student.id,
        )
    )
    attempt_count = attempt_count_result.scalar_one()
    if attempt_count >= assignment.max_attempts:
        raise HTTPException(status_code=400, detail="Maximum submission attempts reached.")

    # Check idempotency
    existing = await db.execute(
        select(SubmissionAttempt).where(
            SubmissionAttempt.idempotency_key == body.idempotency_key
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="This submission was already processed.")

    # Generate presigned URL
    object_key = generate_upload_key(student.tenant_id, body.filename)
    upload_url = presigned_put_url(object_key)

    return RequestUploadResponse(upload_url=upload_url, object_key=object_key)


class CommitUploadRequest(BaseModel):
    assignment_id: str
    object_key: str
    original_name: str
    mime_type: str
    size_bytes: int
    checksum_sha256: str
    idempotency_key: str


@router.post("/submissions/commit", status_code=201)
async def commit_upload(
    body: CommitUploadRequest,
    student: StudentUser,
    db: Annotated[AsyncSession, Depends(get_tenant_db)],
):
    """Finalize a submission after the client has uploaded to MinIO."""
    require(student, "submit", "assignment")

    assignment = await db.get(Assignment, uuid.UUID(body.assignment_id))
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found.")

    # Determine attempt number
    count_result = await db.execute(
        select(func.count()).where(
            SubmissionAttempt.assignment_id == uuid.UUID(body.assignment_id),
            SubmissionAttempt.student_id == student.id,
        )
    )
    attempt_no = count_result.scalar_one() + 1

    # Determine if late
    now = datetime.now(timezone.utc)
    from datetime import timedelta

    grace_deadline = assignment.due_at + timedelta(minutes=assignment.grace_minutes)
    is_late = now > assignment.due_at

    # Create immutable submission attempt
    attempt = SubmissionAttempt(
        tenant_id=student.tenant_id,
        assignment_id=uuid.UUID(body.assignment_id),
        student_id=student.id,
        attempt_no=attempt_no,
        is_late=is_late,
        file_key=body.object_key,
        original_name=body.original_name,
        mime_type=body.mime_type,
        size_bytes=body.size_bytes,
        checksum_sha256=body.checksum_sha256,
        scan_status=ScanStatus.PENDING,
        idempotency_key=body.idempotency_key,
    )
    db.add(attempt)
    await db.flush()

    # TODO: Dispatch Celery task for ClamAV scan
    # scan_file.delay(str(attempt.id), body.object_key)

    return {
        "id": str(attempt.id),
        "attempt_no": attempt.attempt_no,
        "submitted_at": attempt.submitted_at.isoformat(),
        "is_late": attempt.is_late,
        "scan_status": attempt.scan_status.value,
    }


@router.get("/submissions")
async def get_my_submissions(
    student: StudentUser,
    db: Annotated[AsyncSession, Depends(get_tenant_db)],
):
    """Get all submission attempts for the current student."""
    require(student, "view", "own_submissions")
    result = await db.execute(
        select(SubmissionAttempt)
        .where(SubmissionAttempt.student_id == student.id)
        .order_by(SubmissionAttempt.submitted_at.desc())
    )
    attempts = result.scalars().all()
    return [
        {
            "id": str(a.id),
            "assignment_id": str(a.assignment_id),
            "attempt_no": a.attempt_no,
            "submitted_at": a.submitted_at.isoformat(),
            "is_late": a.is_late,
            "original_name": a.original_name,
            "scan_status": a.scan_status.value,
        }
        for a in attempts
    ]


@router.get("/submissions/{attempt_id}/download")
async def download_submission(
    attempt_id: str,
    student: StudentUser,
    db: Annotated[AsyncSession, Depends(get_tenant_db)],
):
    """Get a presigned download URL for a submission file."""
    require(student, "view", "own_submissions")

    attempt = await db.get(SubmissionAttempt, uuid.UUID(attempt_id))
    if not attempt or attempt.student_id != student.id:
        raise HTTPException(status_code=404, detail="Submission not found.")

    if attempt.scan_status != ScanStatus.CLEAN:
        raise HTTPException(status_code=403, detail="File is still being scanned or was quarantined.")

    url = presigned_get_url(attempt.file_key)
    return {"download_url": url, "filename": attempt.original_name}


@router.get("/grades")
async def get_my_grades(
    student: StudentUser,
    db: Annotated[AsyncSession, Depends(get_tenant_db)],
):
    """Get published grades for the current student."""
    require(student, "view", "own_grades")

    # Only show grades that have a PUBLISH event
    result = await db.execute(
        select(GradeEvent)
        .join(SubmissionAttempt, SubmissionAttempt.id == GradeEvent.submission_attempt_id)
        .where(
            SubmissionAttempt.student_id == student.id,
            GradeEvent.event_type == GradeEventType.PUBLISH,
        )
        .order_by(GradeEvent.created_at.desc())
    )
    events = result.scalars().all()
    return [
        {
            "id": str(e.id),
            "submission_attempt_id": str(e.submission_attempt_id),
            "value": float(e.new_value) if e.new_value else None,
            "published_at": e.created_at.isoformat(),
        }
        for e in events
    ]


# ── Regrade requests ──


class RegradeRequest(BaseModel):
    submission_attempt_id: str
    reason: str


@router.post("/regrade-requests", status_code=201)
async def request_regrade(
    body: RegradeRequest,
    student: StudentUser,
    db: Annotated[AsyncSession, Depends(get_tenant_db)],
):
    """Request a regrade for a submission."""
    require(student, "request", "regrade")

    attempt = await db.get(SubmissionAttempt, uuid.UUID(body.submission_attempt_id))
    if not attempt or attempt.student_id != student.id:
        raise HTTPException(status_code=404, detail="Submission not found.")

    event = GradeEvent(
        tenant_id=student.tenant_id,
        submission_attempt_id=attempt.id,
        actor_id=student.id,
        event_type=GradeEventType.REGRADE,
        reason=body.reason,
    )
    db.add(event)
    await db.flush()

    return {"id": str(event.id), "message": "Regrade request submitted."}
