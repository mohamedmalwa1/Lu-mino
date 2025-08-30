# reporting/urls.py
from django.urls import path
from .api.views import (
    ReportRequestView, ReportDetailView, ReportDownloadView, ReportListView
)
from .views import ReportEmailView

urlpatterns = [
    # Core job lifecycle
    path("", ReportListView.as_view(), name="report_list"),
    path("create/", ReportRequestView.as_view(), name="report_create"),
    path("<int:job_id>/", ReportDetailView.as_view(), name="report_detail"),
    path("<int:job_id>/download/", ReportDownloadView.as_view(), name="report_download"),

    # Optional: email a generated report file
    path("email/", ReportEmailView.as_view(), name="report_email"),
]

