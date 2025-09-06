# hr/api/serializers.py

from rest_framework import serializers
from ..models import (
    Staff, StaffAttendance, StaffDocument, Vacation, 
    StaffEvaluation, PayrollProfile, Payslip
)

class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = '__all__'

# --- NEW PAYROLL SERIALIZERS ---
class PayrollProfileSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='staff.full_name', read_only=True)
    class Meta:
        model = PayrollProfile
        fields = '__all__'

class PayslipSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='payroll_profile.staff.full_name', read_only=True)
    class Meta:
        model = Payslip
        fields = '__all__'

# --- OTHER HR SERIALIZERS ---
class StaffAttendanceSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='staff.full_name', read_only=True)
    class Meta:
        model = StaffAttendance
        fields = '__all__'
        
class StaffDocumentSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='staff.full_name', read_only=True)
    class Meta:
        model = StaffDocument
        fields = '__all__'

class VacationSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='staff.full_name', read_only=True)
    class Meta:
        model = Vacation
        fields = '__all__'

class StaffEvaluationSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='staff.full_name', read_only=True)
    class Meta:
        model = StaffEvaluation
        fields = '__all__'
