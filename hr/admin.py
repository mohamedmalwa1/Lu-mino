# hr/admin.py
from django.contrib import admin
from .models import (
    Staff,
    StaffAttendance,
    StaffDocument,
    Vacation,
    StaffEvaluation,
    PayrollContract,
    SalaryRecord,
)

# ───────── STAFF ─────────
@admin.register(Staff)
class StaffAdmin(admin.ModelAdmin):
    list_display  = ("id", "first_name", "last_name", "role", "email", "is_active")
    list_filter   = ("role", "is_active")
    search_fields = ("first_name", "last_name", "email")

# ───────── ATTENDANCE ─────────
@admin.register(StaffAttendance)
class StaffAttendanceAdmin(admin.ModelAdmin):
    list_display  = ("staff", "date", "status")
    list_filter   = ("status", "date")
    autocomplete_fields = ("staff",)
    search_fields = ("staff__first_name", "staff__last_name")

# ───────── DOCUMENTS ─────────
@admin.register(StaffDocument)
class StaffDocumentAdmin(admin.ModelAdmin):
    list_display  = ("staff", "doc_type", "issue_date", "expiration_date")
    autocomplete_fields = ("staff",)
    search_fields = ("staff__first_name", "staff__last_name")

# ───────── VACATION ─────────
@admin.register(Vacation)
class VacationAdmin(admin.ModelAdmin):
    list_display  = ("staff", "start_date", "end_date", "approved")
    list_filter   = ("approved",)
    autocomplete_fields = ("staff",)
    search_fields = ("staff__first_name", "staff__last_name")

# ───────── EVALUATION ─────────
@admin.register(StaffEvaluation)
class StaffEvaluationAdmin(admin.ModelAdmin):
    list_display  = ("staff", "eval_date")
    autocomplete_fields = ("staff",)
    search_fields = ("staff__first_name", "staff__last_name")

# ───────── PAYROLL CONTRACT ─────────
@admin.register(PayrollContract)
class PayrollContractAdmin(admin.ModelAdmin):
    list_display  = ("staff", "base_salary", "contract_start", "contract_end")
    autocomplete_fields = ("staff",)
    search_fields = ("staff__first_name", "staff__last_name")

# ───────── SALARY RECORD ─────────
@admin.register(SalaryRecord)
class SalaryRecordAdmin(admin.ModelAdmin):
    list_display  = ("id", "staff", "month", "gross", "net", "paid")
    list_filter   = ("paid", "month")
    autocomplete_fields = ("staff",)
    search_fields = ("staff__first_name", "staff__last_name")

