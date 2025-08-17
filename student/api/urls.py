# student/api/urls.py
from rest_framework.routers import DefaultRouter
from .views import (
    StudentViewSet, StudentDocumentViewSet, ClassroomViewSet, EnrollmentViewSet,
    AttendanceViewSet, EvaluationViewSet, MedicalRecordViewSet
)

router = DefaultRouter()
router.register("students", StudentViewSet, basename="student")
router.register("documents", StudentDocumentViewSet, basename="studentdocument")
router.register("classrooms", ClassroomViewSet, basename="classroom")
router.register("enrollments", EnrollmentViewSet, basename="enrollment")
router.register("attendances", AttendanceViewSet, basename="attendance")
router.register("evaluations", EvaluationViewSet, basename="evaluation")
router.register("medical-records", MedicalRecordViewSet, basename="medicalrecord")

urlpatterns = router.urls
