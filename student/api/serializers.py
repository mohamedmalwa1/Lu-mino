# student/serializers.py
from rest_framework import serializers
from student.models import (
    Student, Classroom, StudentDocument,
    Enrollment, Attendance, Evaluation, MedicalRecord
)
from hr.models import Staff

class ClassroomSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='assigned_teacher.full_name', read_only=True, allow_null=True)

    class Meta:
        model  = Classroom
        fields = [
            "id", "name", "capacity", "assigned_teacher", "teacher_name",
        ]

class StudentSerializer(serializers.ModelSerializer):
    class_name   = serializers.CharField(source="classroom.name", read_only=True, allow_null=True)
    teacher_name = serializers.CharField(source="classroom.assigned_teacher.full_name", read_only=True, allow_null=True)
    
    class Meta:
        model  = Student
        fields = [
            'id', 'first_name', 'last_name', 'name', 'gender', 'date_of_birth',
            'enrollment_date', 'end_date', 'enrollment_status',
            'enrollment_history', 'is_active', 'classroom',
            'parent_id_number', 'parent_id_expiry', 'student_id_number',
            'student_id_expiry', 'guardian_name', 'guardian_phone',
            'guardian_email',  # ADD THIS LINE
            'class_name', 'teacher_name'
        ]

class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    class_name = serializers.CharField(source='classroom.name', read_only=True)

    class Meta:
        model = Enrollment
        fields = "__all__"

class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.name", read_only=True)

    class Meta:
        model  = Attendance
        fields = "__all__"

class EvaluationSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model  = Evaluation
        fields = "__all__"

class MedicalRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    record_type_display = serializers.CharField(
        source="get_record_type_display", read_only=True
    )

    class Meta:
        model  = MedicalRecord
        fields = "__all__"

class StudentDocumentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    doc_type_display = serializers.CharField(source='get_doc_type_display', read_only=True)
    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = StudentDocument
        fields = [
            'id', 'student', 'student_name', 'doc_type', 'doc_type_display',
            'file', 'issue_date', 'expiration_date', 'is_expired', 'notes',
            'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'expiration_date': {'required': False},
            'notes': {'required': False}
        }
