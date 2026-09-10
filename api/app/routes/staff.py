"""Staff routes: scoped subject/student visibility, grading, broadcasts."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_tenant_db, require_role
from app.models.user import User, UserRole
from app.models.academic import StaffSubjectAssignment, Subject
from app.models.submission import SubmissionAttempt
from app.models.grading import GradeEvent, GradeEventType, RubricCriterion
from app.policies import require

router = APIRouter(prefix="/staff", tags=["staff"])

StaffUser = Annotated[User, Depends(require_role(UserRole.STAFF, UserRole.TENANT_ADMIN))]


@router.get("/subjects")
async def get_my_subjects(
    staff: StaffUser,
    db: Annotated[AsyncSession, Depends(get_tenant_db)],
):
    """Get subjects this staff member is assigned to (scoped by RLS + assignment)."""
    require(staff, "view", "staff_dashboard")
    result = await db.execute(
        select(Subject)
        .join(
            StaffSubjectAssignment,
            StaffSubjectAssignment.subject_id == Subject.id,
        )
        .where(StaffSubjectAssignment.staff_id == staff.id)
        .distinct()
        .order_by(Subject.name)
    )
    subjects = result.scalars().all()
    return [{"id": str(s.id), "name": s.name, "code": s.code} for s in subjects]


@router.get("/subjects/{subject_id}/students")
async def get_students_for_subject(
    subject_id: str,
    staff: StaffUser,
    db: Annotated[AsyncSession, Depends(get_tenant_db)],
):
    """Get students assigned to this staff member for a given subject. Strictly scoped."""
    require(staff, "view", "staff_dashboard")

    # Verify staff is assigned to this subject
    check = await db.execute(
        select(StaffSubjectAssignment).where(
            StaffSubjectAssignment.staff_id == staff.id,
            StaffSubjectAssignment.subject_id == uuid.UUID(subject_id),
        )
    )
    if not check.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="You are not assigned to this subject.")

    # Get students enrolled in sections this staff teaches
    result = await db.execute(
        select(User)
        .join(
            StaffSubjectAssignment,
            StaffSubjectAssignment.section_id == StaffSubjectAssignment.section_id,
        )
        .where(
            StaffSubjectAssignment.staff_id == staff.id,
            StaffSubjectAssignment.subject_id == uuid.UUID(subject_id),
            User.role == UserRole.STUDENT,
        )
        .order_by(User.name)
    )
    students = result.scalars().all()
    return [{"id": str(s.id), "name": s.name, "email": s.email} for s in students]


@router.get("/subjects/{subject_id}/submissions")
async def get_submissions_for_subject(
    subject_id: str,
    staff: StaffUser,
    db: Annotated[AsyncSession, Depends(get_tenant_db)],
):
    """Get submissions for a subject this staff teaches."""
    require(staff, "view", "staff_dashboard")

    # Verify assignment
    check = await db.execute(
        select(StaffSubjectAssignment).where(
            StaffSubjectAssignment.staff_id == staff.id,
            StaffSubjectAssignment.subject_id == uuid.UUID(subject_id),
        )
    )
    if not check.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="You are not assigned to this subject.")

    from app.models.assignment import Assignment

    result = await db.execute(
        select(SubmissionAttempt)
        .join(Assignment, Assignment.id == SubmissionAttempt.assignment_id)
        .where(Assignment.subject_id == uuid.UUID(subject_id))
        .order_by(SubmissionAttempt.submitted_at.desc())
    )
    attempts = result.scalars().all()
    return [
        {
            "id": str(a.id),
            "assignment_id": str(a.assignment_id),
            "student_id": str(a.student_id),
            "attempt_no": a.attempt_no,
            "submitted_at": a.submitted_at.isoformat(),
            "is_late": a.is_late,
            "original_name": a.original_name,
            "scan_status": a.scan_status.value,
        }
        for a in attempts
    ]


# ── Grading ──


class GradeRequest(BaseModel):
    criterion_id: str | None = None
    value: float
    reason: str | None = None
    event_type: str = "draft"


@router.post("/submissions/{attempt_id}/grade", status_code=201)
async def grade_submission(
    attempt_id: str,
    body: GradeRequest,
    staff: StaffUser,
    db: Annotated[AsyncSession, Depends(get_tenant_db)],
):
    """Add a grade event to a submission attempt. Append-only."""
    require(staff, "grade", "submission")

    # Get the submission attempt
    attempt = await db.get(SubmissionAttempt, uuid.UUID(attempt_id))
    if not attempt:
        raise HTTPException(status_code=404, detail="Submission not found.")

    event = GradeEvent(
        tenant_id=staff.tenant_id,
        submission_attempt_id=attempt.id,
        criterion_id=uuid.UUID(body.criterion_id) if body.criterion_id else None,
        actor_id=staff.id,
        event_type=GradeEventType(body.event_type),
        new_value=body.value,
        reason=body.reason,
    )
    db.add(event)
    await db.flush()

    return {"id": str(event.id), "event_type": event.event_type.value, "value": float(body.value)}


@router.post("/submissions/{attempt_id}/publish")
async def publish_grades(
    attempt_id: str,
    staff: StaffUser,
    db: Annotated[AsyncSession, Depends(get_tenant_db)],
):
    """Publish draft grades — makes them visible to the student."""
    require(staff, "grade", "submission")

    # Create a publish event
    event = GradeEvent(
        tenant_id=staff.tenant_id,
        submission_attempt_id=uuid.UUID(attempt_id),
        actor_id=staff.id,
        event_type=GradeEventType.PUBLISH,
        reason="Grades published",
    )
    db.add(event)
    await db.flush()

    return {"ok": True, "message": "Grades published to student."}
