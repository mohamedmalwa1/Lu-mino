# hr/admin.py

from django.contrib import admin
from .models import (
    Staff, StaffAttendance, StaffDocument, Vacation, 
    StaffEvaluation, PayrollProfile, Payslip
)

@admin.register(Staff)
class StaffAdmin(admin.ModelAdmin):
    list_display = ("staff_id", "full_name", "role", "is_active")
    search_fields = ("first_name", "last_name", "staff_id")
    list_filter = ("role", "is_active")

# --- NEW PAYROLL ADMIN MODELS ---
@admin.register(PayrollProfile)
class PayrollProfileAdmin(admin.ModelAdmin):
    list_display = ('staff', 'base_salary', 'allowances', 'contract_start_date')
    search_fields = ('staff__first_name', 'staff__last_name')
    autocomplete_fields = ('staff',)

@admin.register(Payslip)
class PayslipAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'month', 'net_salary', 'is_paid')
    list_filter = ('is_paid', 'month')
    search_fields = ('payroll_profile__staff__first_name',)
    autocomplete_fields = ('payroll_profile',)

# --- OTHER HR ADMIN MODELS ---
@admin.register(StaffAttendance)
class StaffAttendanceAdmin(admin.ModelAdmin):
    list_display = ("staff", "date", "status")
    list_filter = ("status", "date")
    autocomplete_fields = ("staff",)

@admin.register(StaffDocument)
class StaffDocumentAdmin(admin.ModelAdmin):
    list_display = ("staff", "doc_type", "issue_date")
    autocomplete_fields = ("staff",)

@admin.register(Vacation)
class VacationAdmin(admin.ModelAdmin):
    list_display = ("staff", "start_date", "end_date", "approved")
    list_filter = ("approved",)
    autocomplete_fields = ("staff",)

@admin.register(StaffEvaluation)
class StaffEvaluationAdmin(admin.ModelAdmin):
    list_display = ("staff", "eval_date")
    autocomplete_fields = ("staff",)
