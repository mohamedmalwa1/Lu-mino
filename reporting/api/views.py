# reporting/api/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.http import FileResponse
import os

# --- Our new permission class ---
from core.api.permissions import ModulePermission

from ..models import ReportJob
from ..tasks import build_report
from .serializers import ReportJobSerializer


# Note: We are adding ModulePermission and module_name to each class

class ReportListView(APIView):
    permission_classes = [permissions.IsAuthenticated, ModulePermission]
    module_name = 'reporting'

    def get(self, request):
        jobs = ReportJob.objects.all().order_by('-created_at')
        serializer = ReportJobSerializer(jobs, many=True)
        return Response(serializer.data)


class ReportRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated, ModulePermission]
    module_name = 'reporting'

    def post(self, request):
        serializer = ReportJobSerializer(data=request.data)
        if serializer.is_valid():
            # Pass the user to the serializer's save method
            job = serializer.save(created_by=request.user)
            build_report.delay(job.id)
            return Response(serializer.data, status=status.HTTP_202_ACCEPTED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ReportDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, ModulePermission]
    module_name = 'reporting'

    def get(self, request, job_id):
        job = get_object_or_404(ReportJob, id=job_id)
        serializer = ReportJobSerializer(job)
        return Response(serializer.data)


class ReportDownloadView(APIView):
    permission_classes = [permissions.IsAuthenticated, ModulePermission]
    module_name = 'reporting'

    def get(self, request, job_id):
        job = get_object_or_404(ReportJob, id=job_id)
        if job.status != 'COMPLETED':
            return Response({"error": "Report is not ready yet."}, status=status.HTTP_404_NOT_FOUND)
        if not job.file:
            return Response({"error": "Report data was empty or the file is missing."}, status=status.HTTP_404_NOT_FOUND)
        
        filename = os.path.basename(job.file.name)
        
        # Use FileResponse for better handling of file downloads
        response = FileResponse(job.file.open('rb'), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
