"""Backward-compatible models module forwarding to database package."""

try:
    from database.models import (
        Base,
        Tenant,
        User,
        Session,
        AuditLog,
        Institution,
        Department,
        Programme,
        AcademicYear,
        Semester,
        Section,
        Subject,
        Enrollment,
        StaffSubjectAssignment,
        Assignment,
        SubmissionAttempt,
        Rubric,
        RubricCriterion,
        GradeEvent,
    )
except ImportError:
    from app.models.base import Base
    from app.models.tenant import Tenant
    from app.models.user import User, Session
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
    from app.models.assignment import Assignment
    from app.models.submission import SubmissionAttempt
    from app.models.grading import Rubric, RubricCriterion, GradeEvent

__all__ = [
    "Base",
    "Tenant",
    "User",
    "Session",
    "AuditLog",
    "Institution",
    "Department",
    "Programme",
    "AcademicYear",
    "Semester",
    "Section",
    "Subject",
    "Enrollment",
    "StaffSubjectAssignment",
    "Assignment",
    "SubmissionAttempt",
    "Rubric",
    "RubricCriterion",
    "GradeEvent",
]
