# hr/api/urls.py

from rest_framework.routers import DefaultRouter
from .views import (
    StaffViewSet, StaffAttendanceViewSet, StaffDocumentViewSet,
    VacationViewSet, StaffEvaluationViewSet,
    PayrollProfileViewSet, PayslipViewSet
)

router = DefaultRouter()
router.register(r'staff', StaffViewSet)
router.register(r'attendances', StaffAttendanceViewSet)
router.register(r'documents', StaffDocumentViewSet)
router.register(r'vacations', VacationViewSet)
router.register(r'evaluations', StaffEvaluationViewSet)

# --- NEW PAYROLL URLS ---
router.register(r'payroll-profiles', PayrollProfileViewSet)
router.register(r'payslips', PayslipViewSet)

urlpatterns = router.urls
