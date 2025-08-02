from django.db import models
from core.models import TimestampMixin
from hr.models import Staff
from student.models import Student
from django.utils import timezone

class Vendor(TimestampMixin):
    name          = models.CharField(max_length=100)
    contact_email = models.EmailField(blank=True)
    phone         = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return self.name


class Item(TimestampMixin):
    CATEGORY = [
        ("UNIFORM", "Uniform"),
        ("BOOK", "Book"),
        ("EQUIP", "Equipment"),
        ("TOY", "Toy"),
        ("ASSET", "Asset"),
    ]

    name           = models.CharField(max_length=100)
    sku            = models.CharField(max_length=50, unique=True)
    vendor         = models.ForeignKey(Vendor, on_delete=models.SET_NULL, null=True, blank=True)
    category       = models.CharField(max_length=20, choices=CATEGORY)
    unit_price     = models.DecimalField(max_digits=10, decimal_places=2)
    quantity       = models.PositiveIntegerField(default=0)
    min_required   = models.PositiveIntegerField(default=0)
    reorder_level  = models.PositiveIntegerField(default=0)
    last_restock   = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.sku})"


class CustodyAssignment(TimestampMixin):
    item         = models.ForeignKey(Item, on_delete=models.CASCADE)
    quantity     = models.PositiveIntegerField(default=1)
    staff        = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, blank=True)
    student      = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True, blank=True)
    assigned_on  = models.DateField()
    return_date  = models.DateField(null=True, blank=True)
    notes        = models.TextField(blank=True)

    def clean(self):
        from django.core.exceptions import ValidationError
        if not (self.staff or self.student):
            raise ValidationError("Must assign to staff OR student.")
        if self.staff and self.student:
            raise ValidationError("Choose either staff or student, not both.")

    def __str__(self):
        target = self.staff or self.student
        return f"{self.item.name} → {target}"


class StockTake(TimestampMixin):
    item              = models.ForeignKey(Item, on_delete=models.CASCADE)
    date              = models.DateField()
    counted_quantity  = models.PositiveIntegerField()
    responsible_staff = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True)
    notes             = models.TextField(blank=True)

    def discrepancy(self):
        return self.counted_quantity - self.item.quantity

    def __str__(self):
        return f"{self.item.name} audit on {self.date}"

