from rest_framework import viewsets
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

# --- THIS VIEWSET IS NOW UPDATED ---
class PayrollContractViewSet(viewsets.ModelViewSet):
    queryset = PayrollContract.objects.select_related("staff")
    serializer_class = PayrollContractSerializer


class SalaryRecordViewSet(viewsets.ModelViewSet):
    queryset = SalaryRecord.objects.select_related("staff")
    serializer_class = SalaryRecordSerializer

class StaffAttendanceViewSet(viewsets.ModelViewSet):
    queryset = StaffAttendance.objects.select_related("staff")
    serializer_class = StaffAttendanceSerializer

class StaffDocumentViewSet(viewsets.ModelViewSet):
    queryset = StaffDocument.objects.select_related("staff")
    serializer_class = StaffDocumentSerializer

class VacationViewSet(viewsets.ModelViewSet):
    queryset = Vacation.objects.select_related("staff")
    serializer_class = VacationSerializer

class StaffEvaluationViewSet(viewsets.ModelViewSet):
    queryset = StaffEvaluation.objects.select_related("staff")
    serializer_class = StaffEvaluationSerializer

