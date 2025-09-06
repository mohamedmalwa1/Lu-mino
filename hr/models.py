# hr/models.py

from django.db import models
from core.models import TimestampMixin

# --- CORE HR MODELS (UNCHANGED) ---

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

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def __str__(self):
        return self.full_name

class StaffAttendance(TimestampMixin):
    STATUS = [("PRESENT", "Present"), ("ABSENT", "Absent"), ("SICK", "Sick"), ("LEAVE", "On Leave")]
    staff  = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name="attendances")
    date   = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS)
    note   = models.TextField(blank=True)

    class Meta:
        unique_together = [("staff", "date")]
        ordering = ("-date",)

class StaffDocument(TimestampMixin):
    TYPE = [("ID", "ID Card"), ("CONTRACT", "Contract"), ("CERTIFICATE", "Certificate"), ("OTHER", "Other")]
    staff           = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name="documents")
    doc_type        = models.CharField(max_length=20, choices=TYPE)
    file            = models.FileField(upload_to="staff_docs/")
    issue_date      = models.DateField()
    expiration_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.staff} - {self.doc_type}"

class Vacation(TimestampMixin):
    staff       = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name="vacations")
    start_date  = models.DateField()
    end_date    = models.DateField()
    approved    = models.BooleanField(default=False)
    note        = models.TextField(blank=True)

    def __str__(self):
        return f"{self.staff} vacation {self.start_date} to {self.end_date}"

class StaffEvaluation(TimestampMixin):
    staff     = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name="evaluations")
    eval_date = models.DateField()
    summary   = models.TextField()

    def __str__(self):
        return f"{self.staff} eval on {self.eval_date}"


# --- NEW, REFACTORED PAYROLL DOMAIN ---

class PayrollProfile(TimestampMixin):
    """
    This REPLACES the old PayrollContract.
    It stores the financial agreement for a staff member.
    """
    staff = models.OneToOneField(Staff, on_delete=models.CASCADE, related_name="payroll_profile")
    base_salary = models.DecimalField(max_digits=10, decimal_places=2)
    allowances = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    contract_start_date = models.DateField()
    contract_end_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"Payroll Profile for {self.staff.full_name}"

class Payslip(TimestampMixin):
    """
    This REPLACES the old SalaryRecord.
    It is a monthly record of earnings and deductions, generated from the PayrollProfile.
    """
    payroll_profile = models.ForeignKey(PayrollProfile, on_delete=models.CASCADE, related_name="payslips")
    month = models.DateField(help_text="The first day of the month for this payslip.")
    gross_salary = models.DecimalField(max_digits=10, decimal_places=2)
    deductions = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    net_salary = models.DecimalField(max_digits=10, decimal_places=2)
    is_paid = models.BooleanField(default=False)
    
    class Meta:
        unique_together = [("payroll_profile", "month")]
        ordering = ['-month']
        
    def __str__(self):
        return f"Payslip for {self.payroll_profile.staff.full_name} - {self.month.strftime('%B %Y')}"
