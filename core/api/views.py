# app/core/api/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .permissions import _has_django_app_perm, MODULE_ACCESS_RULES

User = get_user_model()

def _can(user, module: str) -> bool:
    if user.is_superuser:
        return True
    groups = set(user.groups.values_list("name", flat=True))
    # group allow (including "__ALL__" Administrator)
    if MODULE_ACCESS_RULES.get("__ALL__") and not groups.isdisjoint(MODULE_ACCESS_RULES["__ALL__"]):
        return True
    if not groups.isdisjoint(MODULE_ACCESS_RULES.get(module, set())):
        return True
    # or any Django permission for that app
    return _has_django_app_perm(user, module)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_permissions(request):
    u = request.user
    return Response({
        "can_access_student":   _can(u, "student"),
        "can_access_hr":        _can(u, "hr"),
        "can_access_finance":   _can(u, "finance"),
        "can_access_inventory": _can(u, "inventory"),
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    u = request.user
    return Response({
        "id": u.id,
        "username": u.username,
        "name": (getattr(u, "get_full_name", lambda: "")() or u.username) or u.username,
        "email": u.email,
        "is_superuser": u.is_superuser,
        "groups": list(u.groups.values_list("name", flat=True)),
    })

