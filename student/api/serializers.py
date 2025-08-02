from rest_framework import serializers
from student.models import (
    Student, Classroom, StudentDocument,
    Enrollment, Attendance, Evaluation, MedicalRecord
)

# --- This serializer is correct and remains unchanged ---
class ClassroomSerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField()

    class Meta:
        model  = Classroom
        fields = [
            "id",
            "name",
            "capacity",
            "assigned_teacher",
            "teacher_name",
        ]

    def get_teacher_name(self, obj):
        if obj.assigned_teacher:
            return obj.assigned_teacher.full_name
        return ""

# --- THIS SERIALIZER IS NOW FIXED ---
class StudentSerializer(serializers.ModelSerializer):
    # Use SerializerMethodField for all computed/related names for safety
    class_name   = serializers.CharField(source="classroom.name", read_only=True, allow_null=True)
    teacher_name = serializers.SerializerMethodField()
    name         = serializers.SerializerMethodField()
    
    class Meta:
        model  = Student
        # Explicitly list all fields to be safe and clear
        fields = [
            'id', 'first_name', 'last_name', 'gender', 'date_of_birth',
            'enrollment_date', 'end_date', 'enrollment_status',
            'enrollment_history', 'is_active', 'classroom',
            'parent_id_number', 'parent_id_expiry', 'student_id_number',
            'student_id_expiry', 'guardian_name', 'guardian_phone',
            # Add our computed fields to the list
            'name', 'class_name', 'teacher_name'
        ]

    def get_name(self, obj):
        """Safely combines first and last name."""
        return f"{obj.first_name} {obj.last_name}"

    def get_teacher_name(self, obj):
        """Safely gets the assigned teacher's full name from the classroom."""
        if obj.classroom and obj.classroom.assigned_teacher:
            return obj.classroom.assigned_teacher.full_name
        return ""

# --- Other serializers remain unchanged ---

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
    class Meta:
        model = StudentDocument
        fields = "__all__"

