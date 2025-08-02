from rest_framework import viewsets
from student.models import (
    Student,
    StudentDocument,
    Classroom,
    Enrollment,
    Attendance,  # Added
    Evaluation,
    MedicalRecord
)
from student.api.serializers import (
    StudentSerializer,
    StudentDocumentSerializer,
    ClassroomSerializer,
    EnrollmentSerializer,
    AttendanceSerializer,  # Added
    EvaluationSerializer,
    MedicalRecordSerializer
)

# Existing views (unchanged)
class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer

class StudentDocumentViewSet(viewsets.ModelViewSet):
    queryset = StudentDocument.objects.select_related("student")
    serializer_class = StudentDocumentSerializer

# student/api/views.py
class ClassroomViewSet(viewsets.ModelViewSet):
    queryset = (
        Classroom.objects
        .select_related("assigned_teacher")   # prevents N+1 & makes teacher_name available
        .all()
    )
    serializer_class = ClassroomSerializer


class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.select_related("student", "classroom")
    serializer_class = EnrollmentSerializer

# New Attendance view
class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.select_related("student")
    serializer_class = AttendanceSerializer
    filterset_fields = ["student", "date", "status"]
    ordering_fields = ["date"]

# Other views...
class EvaluationViewSet(viewsets.ModelViewSet):
    queryset = Evaluation.objects.select_related("student")
    serializer_class = EvaluationSerializer

class MedicalRecordViewSet(viewsets.ModelViewSet):
    queryset = MedicalRecord.objects.select_related("student")
    serializer_class = MedicalRecordSerializer
