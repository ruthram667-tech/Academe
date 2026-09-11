"""All models imported here for Alembic auto-detection."""

from .base import Base
from .tenant import Tenant
from .user import User, Session
from .audit import AuditLog
from .academic import (
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
from .assignment import Assignment
from .submission import SubmissionAttempt
from .grading import Rubric, RubricCriterion, GradeEvent

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
