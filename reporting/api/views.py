from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from reporting.models import ReportJob
from reporting.api.serializers import ReportJobSerializer
from reporting.tasks import build_report

class ReportRequestView(APIView):
    """
    POST {"type":"PNL","params":{"start":"2025-01-01","end":"2025-06-30"}}
    → returns {"job_id":123}
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        rtype   = request.data.get("type")
        kwargs  = request.data.get("params", {})

        job = ReportJob.objects.create(report_type=rtype, parameters=kwargs)
        build_report.delay(job.id, rtype, kwargs)  # queue async build

        return Response({"job_id": job.id}, status=status.HTTP_202_ACCEPTED)


class ReportStatusView(APIView):
    """
    GET /api/reports/123/ → job meta
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, job_id):
        job = get_object_or_404(ReportJob, id=job_id)
        ser = ReportJobSerializer(job)
        return Response(ser.data)


from django.http import FileResponse

class ReportDownloadView(APIView):
    """
    GET /api/reports/123/download/ → file
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, job_id):
        job = get_object_or_404(ReportJob, id=job_id)
        if not job.file:
            return Response(
                {"detail": "Report not ready"}, status=status.HTTP_425_TOO_EARLY
            )
        return FileResponse(job.file.open(), as_attachment=True)

