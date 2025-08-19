# reporting/models.py
from django.db import models
from django.contrib.auth import get_user_model
from django.db.models import JSONField

User = get_user_model()

class ReportJob(models.Model):
    REPORT_TYPES = [
        ("PNL", "Profit & Loss"),
        ("BS", "Balance Sheet"),
        ("CASH", "Cash Flow"),
        ("PAYROLL_VS_ATT", "Payroll vs Attendance (Excel)"),
        ("LOW_STOCK", "Low Stock (Excel)"),
        ("DOC_EXP", "Expiring Documents (Excel)"),
        ("STUDENT_DOCS", "Student Documents (PDF)"),
        ("LOW_STOCK_PDF", "Low Stock (PDF)"),
        ("STUDENT_FEES", "Student Fees Status"),
        ("ENROLL_SUMMARY", "Enrollment Summary"),
    ]

    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("IN_PROGRESS", "In Progress"),
        ("COMPLETED", "Completed"),
        ("FAILED", "Failed"),
    ]

    report_type = models.CharField(max_length=40, choices=REPORT_TYPES)
    parameters = JSONField(default=dict, blank=True)
    requested_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)

    file = models.FileField(upload_to="reports/", blank=True, null=True)

    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="PENDING")
    error = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    generated_at = models.DateTimeField(blank=True, null=True)

    task_id = models.CharField(max_length=64, blank=True, null=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_report_type_display()} #{self.pk}"

