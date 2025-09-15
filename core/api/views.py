# /home/lumino/app/myapp/core/api/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .permissions import _has_django_app_perm, MODULE_ACCESS_RULES

# --- Imports needed for the new DashboardAnalyticsView ---
from rest_framework.views import APIView
from django.db.models import Sum, Count
from django.db.models.functions import TruncMonth
from datetime import datetime
from student.models import Student, Classroom
from finance.models import Invoice, Expense
from hr.models import Staff
# ---------------------------------------------------------

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

# --- ADDED THIS ENTIRE CLASS TO FIX THE ERROR ---
class DashboardAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # --- 1. Key Performance Indicators (KPIs) ---
        total_students = Student.objects.filter(is_active=True).count()
        active_classes = Classroom.objects.count()
        monthly_revenue = Invoice.objects.filter(
            status='PAID',
            issue_date__month=datetime.now().month,
            issue_date__year=datetime.now().year
        ).aggregate(total=Sum('amount'))['total'] or 0
        total_staff = Staff.objects.filter(is_active=True).count()
        
        # --- 2. Student Analytics ---
        enrollment_trend = Student.objects.annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            count=Count('id')
        ).order_by('month')
        
        student_status_distribution = Student.objects.values(
            'enrollment_status'
        ).annotate(count=Count('id')).order_by()

        # --- 3. Finance Analytics ---
        revenue_vs_expenses = Invoice.objects.filter(
            status='PAID'
        ).annotate(
            month=TruncMonth('issue_date')
        ).values('month').annotate(
            revenue=Sum('amount')
        ).order_by('month')
            
        expenses_trend = Expense.objects.annotate(
            month=TruncMonth('date')
        ).values('month').annotate(
            expenses=Sum('amount')
        ).order_by('month')
            
        invoice_status_distribution = Invoice.objects.values(
            'status'
        ).annotate(count=Count('id')).order_by()

        # --- 4. HR Analytics ---
        staff_role_distribution = Staff.objects.filter(
            is_active=True
        ).values('role').annotate(count=Count('id')).order_by()

        # Combine all data into a single response payload
        data = {
            "kpis": {
                "total_students": total_students,
                "active_classes": active_classes,
                "monthly_revenue": monthly_revenue,
                "total_staff": total_staff,
            },
            "student_analytics": {
                "enrollment_trend": list(enrollment_trend),
                "status_distribution": list(student_status_distribution),
            },
            "finance_analytics": {
                "revenue_vs_expenses": list(revenue_vs_expenses),
                "expenses_trend": list(expenses_trend),
                "invoice_status_distribution": list(invoice_status_distribution),
            },
            "hr_analytics": {
                "staff_role_distribution": list(staff_role_distribution),
            }
        }
        
        return Response(data)
# ----------------------------------------------------
