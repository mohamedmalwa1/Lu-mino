from django.contrib import admin
from student.models import (
    Student,
    StudentDocument,
    Classroom,
    Enrollment,
    Attendance,
    Evaluation,
    MedicalRecord,
)


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ("id", "first_name", "last_name", "parent_id_number", "student_id_number")
    search_fields = ("first_name", "last_name", "parent_id_number", "student_id_number")


@admin.register(StudentDocument)
class StudentDocumentAdmin(admin.ModelAdmin):
    list_display = ("student", "doc_type", "expiration_date", "is_expired")
    autocomplete_fields = ("student",)


@admin.register(Classroom)
class ClassroomAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "capacity", "assigned_teacher")
    search_fields = ("name",)


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ("id", "student", "classroom", "start_date", "end_date", "status")
    list_filter = ("status", "classroom")
    autocomplete_fields = ("student", "classroom")


admin.site.register(Attendance)

@admin.register(Evaluation)
class EvaluationAdmin(admin.ModelAdmin):
    list_display = ('student', 'date', 'status', 'has_improvement_plan', 'follow_up_date')
    list_filter = ('status', 'date')
    search_fields = ('student__first_name', 'student__last_name')
    list_select_related = ('student',)  # Optimizes DB queries

    def has_improvement_plan(self, obj):
        return bool(obj.improvement_plan)
    has_improvement_plan.boolean = True  # Shows a checkmark in admin
    has_improvement_plan.short_description = 'Has Plan?'
    
    
@admin.register(MedicalRecord)
class MedicalRecordAdmin(admin.ModelAdmin):
    list_display = ("student", "record_type", "date", "is_urgent", "doctor_name")
    list_filter = ("record_type", "is_urgent", "date")
    search_fields = ("student__first_name", "student__last_name", "description")
    fieldsets = (
        (None, {"fields": ("student", "record_type", "date", "is_urgent")}),
        ("Details", {
            "fields": ("description", "attachment"),
            "classes": ("wide",),
        }),
        ("Conditional Fields", {
            "fields": ("next_checkup_date", "doctor_name", "program_name", "conducted_by"),
            "classes": ("collapse",),
        }),
    )
