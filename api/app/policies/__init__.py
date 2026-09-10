"""Fail-closed authorization policy engine.

Every route MUST declare a policy. A route with no declared policy returns 403.
"""

from typing import Any

from fastapi import HTTPException, status

from app.models.user import User, UserRole


# Policy registry: maps (action, resource_type) → check function
_policies: dict[tuple[str, str], Any] = {}


def register_policy(action: str, resource_type: str):
    """Decorator to register a policy check function."""

    def decorator(func):
        _policies[(action, resource_type)] = func
        return func

    return decorator


def require(actor: User, action: str, resource_type: str, resource: Any = None) -> None:
    """Check if the actor is authorized. Raises 403 if not.

    Fail-closed: if no policy is registered for (action, resource_type), deny.
    """
    key = (action, resource_type)
    if key not in _policies:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"No policy defined for {action}:{resource_type}. Access denied.",
        )

    checker = _policies[key]
    if not checker(actor, resource):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action.",
        )


# ── Built-in policies ──


@register_policy("manage", "tenant")
def _manage_tenant(actor: User, resource: Any) -> bool:
    return actor.role in (UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)


@register_policy("manage", "users")
def _manage_users(actor: User, resource: Any) -> bool:
    return actor.role in (UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)


@register_policy("manage", "academic")
def _manage_academic(actor: User, resource: Any) -> bool:
    return actor.role in (UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)


@register_policy("view", "audit_log")
def _view_audit_log(actor: User, resource: Any) -> bool:
    return actor.role in (UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)


@register_policy("create", "assignment")
def _create_assignment(actor: User, resource: Any) -> bool:
    return actor.role in (UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF)


@register_policy("grade", "submission")
def _grade_submission(actor: User, resource: Any) -> bool:
    return actor.role in (UserRole.STAFF, UserRole.TENANT_ADMIN)


@register_policy("submit", "assignment")
def _submit_assignment(actor: User, resource: Any) -> bool:
    return actor.role == UserRole.STUDENT


@register_policy("view", "own_submissions")
def _view_own_submissions(actor: User, resource: Any) -> bool:
    return actor.role == UserRole.STUDENT


@register_policy("view", "own_grades")
def _view_own_grades(actor: User, resource: Any) -> bool:
    return actor.role == UserRole.STUDENT


@register_policy("request", "regrade")
def _request_regrade(actor: User, resource: Any) -> bool:
    return actor.role == UserRole.STUDENT


@register_policy("view", "staff_dashboard")
def _view_staff_dashboard(actor: User, resource: Any) -> bool:
    return actor.role in (UserRole.STAFF, UserRole.TENANT_ADMIN)


@register_policy("import", "academic_data")
def _import_academic_data(actor: User, resource: Any) -> bool:
    return actor.role in (UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
