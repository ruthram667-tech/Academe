"""Academic structure models.

Hierarchy: Institution → Department → Programme → Semester → Section → Subject
Everything scoped to a semester from the first migration.
"""

import uuid
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    SmallInteger,
    String,
    Text,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TenantMixin, TimestampMixin


class Institution(Base, TenantMixin, TimestampMixin):
    __tablename__ = "institutions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)

    departments = relationship("Department", back_populates="institution", lazy="selectin")


class Department(Base, TenantMixin, TimestampMixin):
    __tablename__ = "departments"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    institution_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)

    institution = relationship("Institution", back_populates="departments")
    programmes = relationship("Programme", back_populates="department", lazy="selectin")


class Programme(Base, TenantMixin, TimestampMixin):
    __tablename__ = "programmes"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    department_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    duration_years: Mapped[int] = mapped_column(SmallInteger, default=4)

    department = relationship("Department", back_populates="programmes")


class AcademicYear(Base, TenantMixin, TimestampMixin):
    __tablename__ = "academic_years"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    label: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g. "2026-2027"
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)

    semesters = relationship("Semester", back_populates="academic_year", lazy="selectin")


class Semester(Base, TenantMixin, TimestampMixin):
    __tablename__ = "semesters"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    academic_year_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False
    )
    number: Mapped[int] = mapped_column(SmallInteger, nullable=False)  # 1, 2, 3...
    label: Mapped[str] = mapped_column(String(100), nullable=False)  # "Semester 1"
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    is_current: Mapped[bool] = mapped_column(Boolean, default=False)

    academic_year = relationship("AcademicYear", back_populates="semesters")


class Section(Base, TenantMixin, TimestampMixin):
    __tablename__ = "sections"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    programme_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("programmes.id", ondelete="CASCADE"), nullable=False
    )
    semester_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("semesters.id", ondelete="CASCADE"), nullable=False
    )
    label: Mapped[str] = mapped_column(String(50), nullable=False)  # "A", "B", etc.


class Subject(Base, TenantMixin, TimestampMixin):
    __tablename__ = "subjects"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    department_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False
    )
    semester_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("semesters.id", ondelete="CASCADE"), nullable=False
    )
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    credits: Mapped[int] = mapped_column(SmallInteger, default=3)


class Enrollment(Base, TenantMixin, TimestampMixin):
    __tablename__ = "enrollments"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    student_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    section_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("sections.id", ondelete="CASCADE"), nullable=False
    )
    semester_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("semesters.id", ondelete="CASCADE"), nullable=False
    )
    register_number: Mapped[str] = mapped_column(String(50), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class StaffSubjectAssignment(Base, TenantMixin, TimestampMixin):
    __tablename__ = "staff_subject_assignments"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    staff_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    subject_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False
    )
    section_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("sections.id", ondelete="CASCADE"), nullable=False
    )
    semester_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("semesters.id", ondelete="CASCADE"), nullable=False
    )
