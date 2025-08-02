from rest_framework import serializers
from hr.models import (
    Staff,
    PayrollContract,
    SalaryRecord,
    StaffAttendance,
    StaffDocument,
    Vacation,
    StaffEvaluation
)

class StaffSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField(read_only=True)

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

    class Meta:
        model  = Staff
        fields = "__all__"

class PayrollContractSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayrollContract
        fields = "__all__"

class SalaryRecordSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='staff.full_name', read_only=True)
    class Meta:
        model = SalaryRecord
        fields = "__all__"

class StaffAttendanceSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='staff.full_name', read_only=True)
    class Meta:
        model = StaffAttendance
        fields = "__all__"

class StaffDocumentSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='staff.full_name', read_only=True)
    class Meta:
        model = StaffDocument
        fields = "__all__"

# --- THIS SERIALIZER IS NOW UPDATED ---
class VacationSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='staff.full_name', read_only=True)
    class Meta:
        model = Vacation
        fields = "__all__"


class StaffEvaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffEvaluation
        fields = "__all__"

