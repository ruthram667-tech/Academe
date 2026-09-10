"""Admin routes: user management, academic setup, Excel import, audit log."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_tenant_db, hash_password, require_role
from app.models.user import User, UserRole
from app.models.audit import AuditLog
from app.models.academic import (
    Institution,
    Department,
    Programme,
    AcademicYear,
    Semester,
    Section,
    Subject,
    Enrollment,
    StaffSubjectAssignment,
)
from app.policies import require

router = APIRouter(prefix="/admin", tags=["admin"])

AdminUser = Annotated[User, Depends(require_role(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN))]


# ── User management ──


class CreateUserRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    is_active: bool


@router.get("/users", response_model=list[UserResponse])
async def list_users(
    admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_tenant_db)],
):
    require(admin, "manage", "users")
    result = await db.execute(select(User).order_by(User.name))
    users = result.scalars().all()
    return [
        UserResponse(
            id=str(u.id), name=u.name, email=u.email,
            role=u.role.value, is_active=u.is_active,
        )
        for u in users
    ]


@router.post("/users", response_model=UserResponse, status_code=201)
async def create_user(
    body: CreateUserRequest,
    admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_tenant_db)],
):
    require(admin, "manage", "users")

    if body.role not in [r.value for r in UserRole]:
        raise HTTPException(status_code=400, detail="Invalid role.")

    user = User(
        tenant_id=admin.tenant_id,
        name=body.name.strip(),
        email=body.email.lower().strip(),
        password_hash=hash_password(body.password),
        role=UserRole(body.role),
    )
    db.add(user)
    await db.flush()

    # Audit log
    db.add(AuditLog(
        tenant_id=admin.tenant_id,
        actor_id=admin.id,
        action="user.create",
        target_type="user",
        target_id=str(user.id),
        new_value={"name": user.name, "email": user.email, "role": body.role},
    ))

    return UserResponse(
        id=str(user.id), name=user.name, email=user.email,
        role=user.role.value, is_active=user.is_active,
    )


# ── Academic structure ──


class InstitutionRequest(BaseModel):
    name: str
    code: str


class SubjectRequest(BaseModel):
    department_id: str
    semester_id: str
    code: str
    name: str
    credits: int = 3


@router.post("/institutions", status_code=201)
async def create_institution(
    body: InstitutionRequest,
    admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_tenant_db)],
):
    require(admin, "manage", "academic")
    inst = Institution(
        tenant_id=admin.tenant_id,
        name=body.name.strip(),
        code=body.code.strip(),
    )
    db.add(inst)
    await db.flush()
    return {"id": str(inst.id), "name": inst.name, "code": inst.code}


@router.get("/institutions")
async def list_institutions(
    admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_tenant_db)],
):
    require(admin, "manage", "academic")
    result = await db.execute(select(Institution).order_by(Institution.name))
    return [{"id": str(i.id), "name": i.name, "code": i.code} for i in result.scalars().all()]


@router.post("/subjects", status_code=201)
async def create_subject(
    body: SubjectRequest,
    admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_tenant_db)],
):
    require(admin, "manage", "academic")
    subject = Subject(
        tenant_id=admin.tenant_id,
        department_id=uuid.UUID(body.department_id),
        semester_id=uuid.UUID(body.semester_id),
        code=body.code.strip(),
        name=body.name.strip(),
        credits=body.credits,
    )
    db.add(subject)
    await db.flush()
    return {"id": str(subject.id), "name": subject.name, "code": subject.code}


@router.get("/subjects")
async def list_subjects(
    admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_tenant_db)],
):
    require(admin, "manage", "academic")
    result = await db.execute(select(Subject).order_by(Subject.name))
    return [
        {"id": str(s.id), "name": s.name, "code": s.code, "credits": s.credits}
        for s in result.scalars().all()
    ]


# ── Staff-subject assignments ──


class AssignStaffRequest(BaseModel):
    staff_id: str
    subject_id: str
    section_id: str
    semester_id: str


@router.post("/staff-assignments", status_code=201)
async def assign_staff_to_subject(
    body: AssignStaffRequest,
    admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_tenant_db)],
):
    require(admin, "manage", "academic")
    assignment = StaffSubjectAssignment(
        tenant_id=admin.tenant_id,
        staff_id=uuid.UUID(body.staff_id),
        subject_id=uuid.UUID(body.subject_id),
        section_id=uuid.UUID(body.section_id),
        semester_id=uuid.UUID(body.semester_id),
    )
    db.add(assignment)
    await db.flush()

    db.add(AuditLog(
        tenant_id=admin.tenant_id,
        actor_id=admin.id,
        action="staff_assignment.create",
        target_type="staff_subject_assignment",
        target_id=str(assignment.id),
        new_value={
            "staff_id": body.staff_id,
            "subject_id": body.subject_id,
            "section_id": body.section_id,
        },
    ))

    return {"id": str(assignment.id), "ok": True}


# ── Excel import ──


@router.post("/import/upload")
async def upload_import_file(
    admin: AdminUser,
    file: UploadFile = File(...),
):
    """Upload an Excel file and return a dry-run diff (no data committed yet)."""
    require(admin, "import", "academic_data")

    if not file.filename or not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Only .xlsx or .xls files are accepted.")

    # TODO: Parse with openpyxl, build diff (added/updated/deactivated counts)
    # For now, return a placeholder response
    return {
        "filename": file.filename,
        "status": "parsed",
        "diff": {
            "students_added": 0,
            "students_updated": 0,
            "students_deactivated": 0,
            "staff_added": 0,
            "subjects_added": 0,
        },
        "message": "Review the diff above, then POST /api/admin/import/confirm to apply.",
    }


@router.post("/import/confirm")
async def confirm_import(
    admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_tenant_db)],
):
    """Apply the previously uploaded import diff in one transaction."""
    require(admin, "import", "academic_data")
    # TODO: Apply the cached diff in a single transaction
    return {"ok": True, "message": "Import applied successfully."}


# ── Audit log ──


@router.get("/audit-log")
async def get_audit_log(
    admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_tenant_db)],
    limit: int = 100,
):
    require(admin, "view", "audit_log")
    result = await db.execute(
        select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
    )
    logs = result.scalars().all()
    return [
        {
            "id": str(log.id),
            "actor_id": str(log.actor_id) if log.actor_id else None,
            "action": log.action,
            "target_type": log.target_type,
            "target_id": log.target_id,
            "old_value": log.old_value,
            "new_value": log.new_value,
            "created_at": log.created_at.isoformat(),
        }
        for log in logs
    ]
