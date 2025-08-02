from django.db import models
from core.models import TimestampMixin


class ReportJob(TimestampMixin):
    """
    Stores generated report files for download & audit.
    """
    REPORT_CHOICES = [
        ("PNL", "Profit & Loss"),
        ("BS", "Balance Sheet"),
        ("CASH", "Cash Flow"),
        ("PAYROLL_VS_ATT", "Payroll vs Attendance"),
        ("LOW_STOCK", "Low Stock"),
    ]
    report_type  = models.CharField(max_length=30, choices=REPORT_CHOICES)
    parameters   = models.JSONField(default=dict)      # e.g. date_range
    file         = models.FileField(upload_to="reports/")
    generated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_report_type_display()} @ {self.generated_at:%Y-%m-%d}"

