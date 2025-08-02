from rest_framework.routers import DefaultRouter
from hr.api.views import (
    StaffViewSet,
    PayrollContractViewSet,
    SalaryRecordViewSet,
    StaffAttendanceViewSet,
    StaffDocumentViewSet,
    VacationViewSet,
    StaffEvaluationViewSet
)

router = DefaultRouter()

router.register("staff", StaffViewSet)
router.register("contracts", PayrollContractViewSet)
router.register("salary-records", SalaryRecordViewSet)
# --- THIS LINE IS NOW CORRECTED ---
router.register("staff-attendances", StaffAttendanceViewSet) 
router.register("documents", StaffDocumentViewSet)
router.register("vacations", VacationViewSet)
router.register("evaluations", StaffEvaluationViewSet)

urlpatterns = router.urls

