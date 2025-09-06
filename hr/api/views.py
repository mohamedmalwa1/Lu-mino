# hr/api/views.py

from rest_framework import viewsets
from ..models import (
    Staff, StaffAttendance, StaffDocument, Vacation, 
    StaffEvaluation, PayrollProfile, Payslip
)
from .serializers import (
    StaffSerializer, StaffAttendanceSerializer, StaffDocumentSerializer, 
    VacationSerializer, StaffEvaluationSerializer, 
    PayrollProfileSerializer, PayslipSerializer
)

class StaffViewSet(viewsets.ModelViewSet):
    queryset = Staff.objects.all()
    serializer_class = StaffSerializer

# --- NEW PAYROLL VIEWSETS ---
class PayrollProfileViewSet(viewsets.ModelViewSet):
    queryset = PayrollProfile.objects.select_related('staff').all()
    serializer_class = PayrollProfileSerializer
    filterset_fields = ['staff']

class PayslipViewSet(viewsets.ModelViewSet):
    queryset = Payslip.objects.select_related('payroll_profile__staff').all()
    serializer_class = PayslipSerializer
    filterset_fields = ['payroll_profile', 'is_paid']

# --- OTHER HR VIEWSETS ---
class StaffAttendanceViewSet(viewsets.ModelViewSet):
    queryset = StaffAttendance.objects.select_related("staff").all()
    serializer_class = StaffAttendanceSerializer
    filterset_fields = ['staff']

class StaffDocumentViewSet(viewsets.ModelViewSet):
    queryset = StaffDocument.objects.select_related("staff").all()
    serializer_class = StaffDocumentSerializer

class VacationViewSet(viewsets.ModelViewSet):
    queryset = Vacation.objects.select_related("staff").all()
    serializer_class = VacationSerializer

class StaffEvaluationViewSet(viewsets.ModelViewSet):
    queryset = StaffEvaluation.objects.select_related("staff").all()
    serializer_class = StaffEvaluationSerializer
