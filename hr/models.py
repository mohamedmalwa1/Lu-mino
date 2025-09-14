from django.db import models
from core.models import TimestampMixin


class Staff(TimestampMixin):
    ROLE = [("TEACHER", "Teacher"), ("ASSISTANT", "Assistant"),
            ("ADMIN", "Administrator"), ("NURSE", "Nurse")]

    first_name   = models.CharField(max_length=50)
    last_name    = models.CharField(max_length=50)
    role         = models.CharField(max_length=20, choices=ROLE)
    email        = models.EmailField(unique=True)
    phone        = models.CharField(max_length=20)
    id_number    = models.CharField(max_length=50, unique=True)
    id_expiry    = models.DateField()
    hire_date    = models.DateField()
    is_active    = models.BooleanField(default=True)

    # --- ADD THIS PROPERTY ---
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    # -------------------------

    def __str__(self):
        return self.full_name


# ─────────── Staff Attendance ───────────
class StaffAttendance(TimestampMixin):
    STATUS = [("PRESENT", "Present"), ("ABSENT", "Absent"), ("SICK", "Sick"), ("LEAVE", "On Leave")]
    staff  = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name="attendances")
    date   = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS)
    note   = models.TextField(blank=True)

    class Meta:
        unique_together = [("staff", "date")]
        ordering = ("-date",)


# ─────────── Staff Documents ───────────
class StaffDocument(TimestampMixin):
    TYPE = [("ID", "ID Card"), ("CONTRACT", "Contract"), ("CERTIFICATE", "Certificate"), ("OTHER", "Other")]
    staff           = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name="documents")
    doc_type        = models.CharField(max_length=20, choices=TYPE)
    file            = models.FileField(upload_to="staff_docs/")
    issue_date      = models.DateField()
    expiration_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.staff} - {self.doc_type}"


# ─────────── Vacation ───────────
class Vacation(TimestampMixin):
    staff       = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name="vacations")
    start_date  = models.DateField()
    end_date    = models.DateField()
    approved    = models.BooleanField(default=False)
    note        = models.TextField(blank=True)

    def __str__(self):
        return f"{self.staff} vacation {self.start_date} to {self.end_date}"


# ─────────── Evaluation ───────────
class StaffEvaluation(TimestampMixin):
    staff     = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name="evaluations")
    eval_date = models.DateField()
    summary   = models.TextField()

    def __str__(self):
        return f"{self.staff} eval on {self.eval_date}"


# ─────────── Payroll ───────────
class PayrollContract(TimestampMixin):
    staff          = models.OneToOneField(Staff, on_delete=models.CASCADE, related_name="contract")
    base_salary    = models.DecimalField(max_digits=10, decimal_places=2)
    allowance      = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    contract_start = models.DateField()
    contract_end   = models.DateField(null=True, blank=True)


# Add these methods to your SalaryRecord model:

class SalaryRecord(TimestampMixin):
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name="salaries")
    month = models.DateField(help_text="Set to 1st of month")
    gross = models.DecimalField(max_digits=10, decimal_places=2)
    deduct = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    net = models.DecimalField(max_digits=10, decimal_places=2)
    paid = models.BooleanField(default=False)
    
    def save(self, *args, **kwargs):
        # Automatically calculate net salary
        self.net = self.gross - self.deduct
        super().save(*args, **kwargs)

    class Meta:
        unique_together = [("staff", "month")]
        ordering = ['-month']
        
    def __str__(self):
        return f"Salary for {self.staff.full_name} - {self.month.strftime('%B %Y')}"
    
    # Add this method for API serialization
    def to_dict(self):
        return {
            "id": self.id,
            "staff": {
                "id": self.staff.id,
                "full_name": self.staff.full_name
            },
            "month": self.month,
            "gross": str(self.gross),
            "deduct": str(self.deduct),
            "net": str(self.net),
            "paid": self.paid,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }

