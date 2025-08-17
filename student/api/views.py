# student/api/views.py
from rest_framework import viewsets
from student.models import Student, StudentDocument, Classroom, Enrollment, Attendance, Evaluation, MedicalRecord
from .serializers import (
    StudentSerializer, StudentDocumentSerializer, ClassroomSerializer, EnrollmentSerializer,
    AttendanceSerializer, EvaluationSerializer, MedicalRecordSerializer
)

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.select_related("classroom")
    serializer_class = StudentSerializer
    filterset_fields = ['is_active', 'classroom', 'enrollment_status']
    search_fields = ['first_name', 'last_name']

class ClassroomViewSet(viewsets.ModelViewSet):
    queryset = Classroom.objects.select_related("assigned_teacher")
    serializer_class = ClassroomSerializer

class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.select_related("student", "classroom")
    serializer_class = EnrollmentSerializer

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.select_related("student")
    serializer_class = AttendanceSerializer

class EvaluationViewSet(viewsets.ModelViewSet):
    queryset = Evaluation.objects.select_related("student")
    serializer_class = EvaluationSerializer

class MedicalRecordViewSet(viewsets.ModelViewSet):
    queryset = MedicalRecord.objects.select_related("student")
    serializer_class = MedicalRecordSerializer

class StudentDocumentViewSet(viewsets.ModelViewSet):
    queryset = StudentDocument.objects.select_related("student")
    serializer_class = StudentDocumentSerializer
