from rest_framework import viewsets
from student.models import (
    Student,
    StudentDocument,
    Classroom,
    Enrollment,
    Attendance,
    Evaluation,
    MedicalRecord
)
from student.api.serializers import (
    StudentSerializer,
    StudentDocumentSerializer,
    ClassroomSerializer,
    EnrollmentSerializer,
    AttendanceSerializer,
    EvaluationSerializer,
    MedicalRecordSerializer
)

class StudentViewSet(viewsets.ModelViewSet):
    # Join the classroom and teacher tables to prevent extra queries
    queryset = Student.objects.select_related("classroom__assigned_teacher")
    serializer_class = StudentSerializer

class StudentDocumentViewSet(viewsets.ModelViewSet):
    queryset = StudentDocument.objects.select_related("student")
    serializer_class = StudentDocumentSerializer

class ClassroomViewSet(viewsets.ModelViewSet):
    queryset = Classroom.objects.select_related("assigned_teacher")
    serializer_class = ClassroomSerializer

class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.select_related("student", "classroom")
    serializer_class = EnrollmentSerializer

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.select_related("student")
    serializer_class = AttendanceSerializer
    filterset_fields = ["student", "date", "status"]
    ordering_fields = ["date"]

class EvaluationViewSet(viewsets.ModelViewSet):
    queryset = Evaluation.objects.select_related("student")
    serializer_class = EvaluationSerializer

class MedicalRecordViewSet(viewsets.ModelViewSet):
    queryset = MedicalRecord.objects.select_related("student")
    serializer_class = MedicalRecordSerializer

