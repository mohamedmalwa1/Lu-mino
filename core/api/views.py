# app/core/api/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_module_permissions(request):
    """
    An endpoint that returns a dictionary of modules the user can access.
    """
    user = request.user
    if user.is_superuser:
        return Response({
            'can_access_student': True,
            'can_access_finance': True,
            'can_access_hr': True,
            'can_access_inventory': True,
        })

    groups = set(user.groups.values_list('name', flat=True))

    permissions = {
        'can_access_student': not groups.isdisjoint({'HR Manager', 'Admissions Officer', 'Teacher'}),
        'can_access_finance': not groups.isdisjoint({'Finance Manager', 'HR Manager'}),
        'can_access_hr': not groups.isdisjoint({'HR Manager'}),
        'can_access_inventory': not groups.isdisjoint({'Inventory Manager'}),
    }
    return Response(permissions)
