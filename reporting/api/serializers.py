from rest_framework import serializers
from reporting.models import ReportJob

class ReportJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportJob
        fields = "__all__"
        read_only_fields = ("file", "generated_at")

