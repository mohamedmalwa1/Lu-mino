from django.urls import path
from .views import ReportRequestView, ReportStatusView, ReportDownloadView

urlpatterns = [
    path("", ReportRequestView.as_view(), name="report_request"),
    path("<int:job_id>/", ReportStatusView.as_view(), name="report_status"),
    path("<int:job_id>/download/", ReportDownloadView.as_view(), name="report_download"),
]

