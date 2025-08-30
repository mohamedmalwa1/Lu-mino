# student/models.py
from datetime import date
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from core.models import TimestampMixin
from hr.models import Staff

class Classroom(TimestampMixin):
    name = models.CharField(max_length=100, unique=True)
    capacity = models.PositiveIntegerField(default=25)
    assigned_teacher = models.ForeignKey(
        Staff, on_delete=models.SET_NULL, null=True, blank=True,
        limit_choices_to={"role": "TEACHER"}, related_name="assigned_classes"
    )
    def __str__(self): return self.name

class Student(TimestampMixin):
    GENDER_CHOICES = [("M", "Male"), ("F", "Female")]
    STATUS_CHOICES = [
        ('active', 'Active'), ('graduated', 'Graduated'), ('left', 'Left'),
        ('shifted', 'Shifted'), ('nonactive', 'Non-Active'),
    ]
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    date_of_birth = models.DateField()
    enrollment_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    enrollment_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    classroom = models.ForeignKey(Classroom, on_delete=models.SET_NULL, null=True, blank=True)
    guardian_name = models.CharField(max_length=100)
    guardian_phone = models.CharField(max_length=20)
    guardian_email = models.EmailField(max_length=254, blank=True, null=True) # ADD THIS LINE
    parent_id_number = models.CharField(max_length=50, unique=True)
    parent_id_expiry = models.DateField()
    student_id_number = models.CharField(max_length=20, unique=True, null=True, blank=True)
    student_id_expiry = models.DateField(null=True, blank=True)
    enrollment_history = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    @property
    def name(self): return f"{self.first_name} {self.last_name}"
    def __str__(self): return self.name

class Enrollment(TimestampMixin):
    STATUS_CHOICES = [("ACTIVE", "Active"), ("GRADUATED", "Graduated"), ("LEFT", "Left")]
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    classroom = models.ForeignKey(Classroom, on_delete=models.PROTECT)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="ACTIVE")
    class Meta:
        unique_together = ("student", "classroom", "start_date")
        ordering = ["-start_date"]
    def __str__(self): return f"{self.student} in {self.classroom}"

class Attendance(TimestampMixin):
    STATUS_CHOICES = [("PRESENT", "Present"), ("ABSENT", "Absent"), ("LATE", "Late"), ("SICK", "Sick")]
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="attendances")
    date = models.DateField(default=timezone.now)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    notes = models.TextField(blank=True)
    class Meta:
        unique_together = ("student", "date")
        ordering = ("-date",)

class Evaluation(TimestampMixin):
    STATUS_CHOICES = [('EXCELLENT', 'Excellent'), ('GOOD', 'Good'), ('ON_TRACK', 'On Track'), ('NEEDS_WORK', 'Needs to Work On')]
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="evaluations")
    date = models.DateField(default=timezone.now)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ON_TRACK')
    general_notes = models.TextField(blank=True)
    improvement_plan = models.TextField(blank=True)
    follow_up_date = models.DateField(null=True, blank=True)

# In student/models.py

class MedicalRecord(TimestampMixin):
    # THE FIX IS HERE: Added all the missing choices
    RECORD_TYPE_CHOICES = [
        ("ALLERGY", "Allergy"),
        ("MEDICATION", "Medication"),
        ("TREATMENT", "Treatment"),
        ("VACCINATION", "Vaccination"),
        ("CHECKUP", "Checkup"),
        ("DOCTOR_NOTE", "Doctor's Note"),
        ("EDUCATION", "Health Education"),
    ]
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="medical_records")
    record_type = models.CharField(max_length=20, choices=RECORD_TYPE_CHOICES)
    date = models.DateField(default=timezone.now)
    description = models.TextField()
    is_urgent = models.BooleanField(default=False)
    # These fields are in your form, but not in the model. Let's add them.
    doctor_name = models.CharField(max_length=100, blank=True, null=True)
    conducted_by = models.CharField(max_length=100, blank=True, null=True)
    program_name = models.CharField(max_length=100, blank=True, null=True)
    next_checkup_date = models.DateField(blank=True, null=True)

class StudentDocument(TimestampMixin):
    DOC_TYPE_CHOICES = [
        ("BIRTH_CERT", "Birth Certificate"),
        ("ID", "ID Card"),
        ("PASSPORT", "Passport"),
        ("VISA", "Visa"),
        ("RESIDENCE", "Residence Permit"),
        ("VACCINE", "Vaccination Record"),
        ("TRANSCRIPT", "Academic Transcript"),
        ("OTHER", "Other"),
    ]
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="documents")
    doc_type = models.CharField(max_length=20, choices=DOC_TYPE_CHOICES)
    file = models.FileField(upload_to="student_docs/%Y/%m/%d/")
    issue_date = models.DateField(default=date.today)
    expiration_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    
    @property
    def is_expired(self):
        return self.expiration_date and self.expiration_date < date.today()
    
    class Meta:
        ordering = ['-issue_date']
