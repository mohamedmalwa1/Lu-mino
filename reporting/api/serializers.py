# reporting/api/serializers.py
from django.urls import reverse
from rest_framework import serializers
from reporting.models import ReportJob


class ReportJobSerializer(serializers.ModelSerializer):
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = ReportJob
        fields = [
            'id',
            'report_type',
            'report_type_display',
            'parameters',
            'file',
            'generated_at',
            'status',
            'status_display',
            'error',
            'download_url',
        ]
        read_only_fields = ['file', 'generated_at', 'status', 'error']

    def validate_parameters(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("Parameters must be a JSON object")
        return value

    def get_download_url(self, obj):
        # Always build from the named route so prefixes like /api/v1/ stay correct
        if obj.file:
            return reverse('report_download', kwargs={'job_id': obj.id})
        return None

