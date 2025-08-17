# student/admin.py
from django.contrib import admin
from .models import Student, StudentDocument, Classroom, Enrollment, Attendance, Evaluation, MedicalRecord

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "classroom", "enrollment_status", "is_active")
    search_fields = ("first_name", "last_name", "parent_id_number")
    list_filter = ("is_active", "classroom", "enrollment_status")
    autocomplete_fields = ("classroom",)

@admin.register(Classroom)
class ClassroomAdmin(admin.ModelAdmin):
    list_display = ("name", "capacity", "assigned_teacher")
    search_fields = ("name",)
    autocomplete_fields = ("assigned_teacher",)

@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ("student", "classroom", "start_date", "end_date", "status")
    list_filter = ("status", "classroom")
    autocomplete_fields = ("student", "classroom")

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ("student", "date", "status")
    list_filter = ("status", "date")
    autocomplete_fields = ("student",)

@admin.register(Evaluation)
class EvaluationAdmin(admin.ModelAdmin):
    list_display = ('student', 'date', 'status')
    list_filter = ('status', 'date')
    autocomplete_fields = ('student',)

@admin.register(MedicalRecord)
class MedicalRecordAdmin(admin.ModelAdmin):
    list_display = ("student", "record_type", "date", "is_urgent")
    list_filter = ("record_type", "is_urgent")
    autocomplete_fields = ("student",)

@admin.register(StudentDocument)
class StudentDocumentAdmin(admin.ModelAdmin):
    list_display = ("student", "doc_type", "expiration_date", "get_is_expired")
    autocomplete_fields = ("student",)
    
    @admin.display(boolean=True, description='Is Expired?')
    def get_is_expired(self, obj):
        return obj.is_expired
