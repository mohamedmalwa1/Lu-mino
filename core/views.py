from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count
from django.db.models.functions import TruncMonth
from datetime import datetime

# Import all necessary models
from student.models import Student, Classroom
from finance.models import Invoice, Expense
from hr.models import Staff

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
        # The indentation error was likely in this multi-line query
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
        ).annotate(month=TruncMonth('issue_date')).values(
            'month'
        ).annotate(revenue=Sum('amount')).order_by('month')
            
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
