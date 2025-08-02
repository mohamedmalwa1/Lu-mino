from rest_framework.routers import DefaultRouter
from student.api.views import (
    StudentViewSet,
    StudentDocumentViewSet,
    ClassroomViewSet,
    EnrollmentViewSet,
    AttendanceViewSet,
    EvaluationViewSet,
    MedicalRecordViewSet,
)

router = DefaultRouter()
router.register("students",         StudentViewSet)
router.register("documents",        StudentDocumentViewSet)
router.register("classrooms",       ClassroomViewSet)
router.register("enrollments",      EnrollmentViewSet)
router.register("attendances",      AttendanceViewSet)
router.register("evaluations",      EvaluationViewSet)
router.register("medical-records",  MedicalRecordViewSet)

urlpatterns = router.urls

