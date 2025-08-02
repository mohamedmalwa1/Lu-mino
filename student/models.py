from datetime import date
from django.db import models
from core.models import TimestampMixin
from django.utils import timezone
from django.core.exceptions import ValidationError


# ─────────── Classroom ───────────
class Classroom(TimestampMixin):
    name             = models.CharField(max_length=50, unique=True)
    capacity         = models.PositiveIntegerField(default=25)
    assigned_teacher = models.ForeignKey(
        "hr.Staff",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={"role": "TEACHER"},
        related_name="assigned_classes",
    )

    def __str__(self):
        return self.name


# ─────────── Student ───────────
class Student(TimestampMixin):
    GENDER_CHOICES = [("M", "Male"), ("F", "Female")]

    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    date_of_birth = models.DateField()

    enrollment_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    ENROLLMENT_STATUS_CHOICES = [
        ('active', 'Active'),
        ('graduated', 'Graduated'),
        ('left', 'Left'),
        ('shifted', 'Shifted'),
        ('nonactive', 'nonactive'),
    ]
    enrollment_status = models.CharField(
        max_length=20,
        choices=ENROLLMENT_STATUS_CHOICES,
        default='active'
    )
    enrollment_history = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    classroom = models.ForeignKey(
        Classroom, on_delete=models.SET_NULL,
        null=True, blank=True
    )

    parent_id_number = models.CharField(max_length=50, unique=True)
    parent_id_expiry = models.DateField()
    student_id_number = models.CharField(
        max_length=20, unique=True,
        null=True, blank=True
    )
    student_id_expiry = models.DateField(null=True, blank=True)
    guardian_name = models.CharField(max_length=100)
    guardian_phone = models.CharField(max_length=20)

    # --- ADD THIS PROPERTY ---
    @property
    def name(self):
        return f"{self.first_name} {self.last_name}"
    # -------------------------

    def __str__(self):
        return self.name


# ─────────── Attendance ───────────
class Attendance(TimestampMixin):
    STATUS = [("PRESENT", "Present"), ("ABSENT", "Absent"), ("LATE", "Late"), ("SICK", "Sick")]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="attendances")
    date    = models.DateField()
    status  = models.CharField(max_length=10, choices=STATUS)
    notes   = models.TextField(blank=True)

    class Meta:
        unique_together = [("student", "date")]
        ordering = ("-date",)


# ─────────── Evaluation ───────────
class Evaluation(TimestampMixin):
    STATUS_CHOICES = [
        ('EXCELLENT', 'Excellent'),
        ('GOOD', 'Good'),
        ('ON_TRACK', 'On Track'),
        ('NEEDS_WORK', 'Needs to Work On'),
    ]
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="evaluations")
    date = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='ON_TRACK'
    )
    general_notes = models.TextField(blank=True)
    improvement_plan = models.TextField(
        blank=True,
        verbose_name="Improvement Plan (if 'Needs to Work On')"
    )
    follow_up_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Follow-up Date (if 'Needs to Work On')"
    )

    def save(self, *args, **kwargs):
        if self.status != 'NEEDS_WORK':
            self.improvement_plan = ''
            self.follow_up_date = None
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student} - {self.get_status_display()} ({self.date})"


# ─────────── Medical Record ───────────
class MedicalRecord(TimestampMixin):
    RECORD_TYPE = [
        ("ALLERGY", "Allergy"),
        ("MEDICATION", "Medication"),
        ("TREATMENT", "Treatment"),
        ("VACCINATION", "Vaccination"),
        ("CHECKUP", "Periodic Checkup"),
        ("DOCTOR_NOTE", "Doctor’s Notes"),
        ("EDUCATION", "Health Education"),
    ]
    
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="medical_records"
    )
    record_type = models.CharField(max_length=20, choices=RECORD_TYPE)
    date = models.DateField(
        default=timezone.now,
        verbose_name="Record Date"
    )
    description = models.TextField()
    attachment = models.FileField(upload_to="medical/", blank=True)
    
    next_checkup_date = models.DateField(
        blank=True,
        null=True,
        verbose_name="Next Checkup Due"
    )
    doctor_name = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Doctor/Clinic Name"
    )
    is_urgent = models.BooleanField(
        default=False,
        verbose_name="Urgent Attention Needed"
    )
    
    program_name = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Health Program Name"
    )
    conducted_by = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Conducted By"
    )

    def clean(self):
        if self.record_type == "CHECKUP" and not self.next_checkup_date:
            raise ValidationError("Next checkup date is required for periodic checkups.")
        if self.record_type == "DOCTOR_NOTE" and not self.doctor_name:
            raise ValidationError("Doctor name is required for doctor's notes.")

    def __str__(self):
        return f"{self.student}: {self.get_record_type_display()} ({self.date})"

# ─────────── Student Documents ───────────
class StudentDocument(TimestampMixin):
    DOC = [("BIRTH_CERT", "Birth Certificate"), ("ID", "ID / Passport"), ("Parents Doc", "Parents Doc"), ("School Cert", "School Cert")]

    student          = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="documents")
    doc_type         = models.CharField(max_length=20, choices=DOC)
    file             = models.FileField(upload_to="student_docs/")
    issue_date       = models.DateField()
    expiration_date  = models.DateField(null=True, blank=True)

    @property
    def is_expired(self):
        return self.expiration_date and self.expiration_date < date.today()


# ─────────── Enrollment ───────────
class Enrollment(TimestampMixin):
    STATUS_CHOICES = [
        ("ACTIVE", "Active"),
        ("GRADUATED", "Graduated"),
        ("LEFT", "Left"),
        ("SHIFTED", "Shifted from another school"),
    ]

    student     = models.ForeignKey(Student, on_delete=models.CASCADE)
    classroom   = models.ForeignKey(Classroom, on_delete=models.PROTECT)
    start_date  = models.DateField()
    end_date    = models.DateField(null=True, blank=True)
    status      = models.CharField(max_length=10, choices=STATUS_CHOICES, default="ACTIVE")

    class Meta:
        unique_together = ("student", "classroom", "start_date")
        ordering = ["-start_date"]

    def __str__(self):
        return f"{self.student} → {self.classroom} ({self.start_date})"

