from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, DjangoModelPermissions  # <-- ADD THIS LINE
from core.api.permissions import ModulePermission
from hr.models import (
    Staff,
    PayrollContract,
    SalaryRecord,
    StaffAttendance,
    StaffDocument,
    Vacation,
    StaffEvaluation
)
from hr.api.serializers import (
    StaffSerializer,
    PayrollContractSerializer,
    SalaryRecordSerializer,
    StaffAttendanceSerializer,
    StaffDocumentSerializer,
    VacationSerializer,
    StaffEvaluationSerializer
)

class StaffViewSet(viewsets.ModelViewSet):
    queryset = Staff.objects.all()
    serializer_class = StaffSerializer
    permission_classes = [IsAuthenticated, ModulePermission]
    module_name = 'hr'

# --- THIS VIEWSET IS NOW UPDATED ---
class PayrollContractViewSet(viewsets.ModelViewSet):
    queryset = PayrollContract.objects.select_related("staff")
    serializer_class = PayrollContractSerializer
    permission_classes = [IsAuthenticated, ModulePermission]
    module_name = 'hr'


class SalaryRecordViewSet(viewsets.ModelViewSet):
    queryset = SalaryRecord.objects.select_related("staff")
    serializer_class = SalaryRecordSerializer
    permission_classes = [IsAuthenticated, ModulePermission]
    module_name = 'hr'

class StaffAttendanceViewSet(viewsets.ModelViewSet):
    queryset = StaffAttendance.objects.select_related("staff")
    serializer_class = StaffAttendanceSerializer
    permission_classes = [IsAuthenticated, ModulePermission]
    module_name = 'hr'

class StaffDocumentViewSet(viewsets.ModelViewSet):
    queryset = StaffDocument.objects.select_related("staff")
    serializer_class = StaffDocumentSerializer
    permission_classes = [IsAuthenticated, ModulePermission]
    module_name = 'hr'

class VacationViewSet(viewsets.ModelViewSet):
    queryset = Vacation.objects.select_related("staff")
    serializer_class = VacationSerializer
    permission_classes = [IsAuthenticated, ModulePermission]
    module_name = 'hr'

class StaffEvaluationViewSet(viewsets.ModelViewSet):
    queryset = StaffEvaluation.objects.select_related("staff")
    serializer_class = StaffEvaluationSerializer
    permission_classes = [IsAuthenticated, ModulePermission]
    module_name = 'hr'

