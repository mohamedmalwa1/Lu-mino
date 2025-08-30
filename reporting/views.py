# reporting/views.py
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response

from .tasks import email_report
from .models import ReportJob

class ReportEmailView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        job_id = request.data.get("job_id")
        to = request.data.get("to") or []
        if not job_id or not to:
            return Response({"detail": "job_id and to[] are required"}, status=400)
        try:
            job = ReportJob.objects.get(id=job_id, requested_by=request.user)
        except ReportJob.DoesNotExist:
            return Response({"detail": "Report not found"}, status=404)
        email_report.delay(job.id, to)
        return Response({"status": "queued"})

