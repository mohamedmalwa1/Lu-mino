# app/core/api/permissions.py
from rest_framework import permissions

# Groups with module access (edit as needed)
MODULE_ACCESS_RULES = {
    "student":   {"Admissions Officer", "Teacher"},
    "hr":        {"HR Manager"},
    "finance":   {"Finance Manager"},
    "inventory": {"Inventory Manager"},
    # Give full access if you use an "Administrator" group
    "__ALL__":   {"Administrator"},
}

def _has_django_app_perm(user, app_label: str) -> bool:
    """
    If the user has ANY Django permission under this app_label (e.g. 'hr.add_staff'),
    consider that as access to the module. This lets you use the standard Django perms
    instead of (or alongside) groups.
    """
    if user.is_superuser:
        return True
    perms = user.get_all_permissions()  # e.g. {'hr.add_staff', 'student.view_student', ...}
    prefix = f"{app_label}."
    return any(p.startswith(prefix) for p in perms)

class ModulePermission(permissions.BasePermission):
    """
    Enforces module-level access.
    Each DRF view must declare: module_name = 'student'|'hr'|'finance'|'inventory'
    Superusers bypass all checks.
    """
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True

        module = getattr(view, "module_name", None)
        if not module:
            return False  # secure default

        # 1) Group-based allow
        user_groups = set(user.groups.values_list("name", flat=True))
        if MODULE_ACCESS_RULES.get("__ALL__") and not user_groups.isdisjoint(MODULE_ACCESS_RULES["__ALL__"]):
            return True
        allowed_groups = MODULE_ACCESS_RULES.get(module, set())
        if not user_groups.isdisjoint(allowed_groups):
            return True

        # 2) OR: any Django model permission for the app_label
        return _has_django_app_perm(user, module)

