# app/core/api/permissions.py
from rest_framework import permissions

class ModulePermission(permissions.BasePermission):
    """
    Checks if a user's group has permission to access a specific module.
    """
    def has_permission(self, request, view):
        # Superusers can do anything
        if request.user.is_superuser:
            return True

        # Get the required module from the view
        required_module = getattr(view, 'module_name', None)
        if not required_module:
            # If a view doesn't specify a module, deny access by default for safety.
            return False

        # Get the user's groups
        user_groups = set(request.user.groups.values_list('name', flat=True))

        # --- Define Your Rules Here ---
        # A dictionary where keys are module names and values are a set of groups that can access it.
        module_access_rules = {
            'student': {'HR Manager', 'Admissions Officer', 'Teacher'},
            'finance': {'Finance Manager', 'HR Manager'},
            'hr': {'HR Manager'},
            'inventory': {'Inventory Manager'},
        }

        # Get the allowed groups for the required module
        allowed_groups = module_access_rules.get(required_module, set())

        # Check if the user belongs to any of the allowed groups
        return not user_groups.isdisjoint(allowed_groups)
