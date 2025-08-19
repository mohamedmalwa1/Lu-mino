# File to edit: reporting/urls.py

from django.urls import path
from .views import ReportRequestView, ReportDetailView, ReportDownloadView, ReportListView

urlpatterns = [
    # GET /api/v1/reporting/ -> List all reports
    path("", ReportListView.as_view(), name="report_list"),
    # POST /api/v1/reporting/create/ -> Start a new report
    path("create/", ReportRequestView.as_view(), name="report_create"),
    # GET /api/v1/reporting/123/ -> Check status of a report
    path("<int:job_id>/", ReportDetailView.as_view(), name="report_detail"),
    # GET /api/v1/reporting/123/download/ -> Download the file
    path("<int:job_id>/download/", ReportDownloadView.as_view(), name="report_download"),
]
