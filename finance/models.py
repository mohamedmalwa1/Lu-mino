# finance/models.py

from django.db import models
from core.models import TimestampMixin
from students.models import Student
from hr.models import Payslip # CORRECT: Imports the new Payslip model
from inventory.models import Vendor, Item

# --- Helper Functions for Automatic Numbering ---
def next_invoice_number():
    last = Invoice.objects.order_by("id").last()
    if not last: return "INV-0001"
    num = int(last.invoice_number.split("-")[-1]) + 1
    return f"INV-{num:04d}"

def next_po_number():
    last = PurchaseOrder.objects.order_by("id").last()
    if not last: return "PO-0001"
    num = int(last.po_number.split("-")[-1]) + 1
    return f"PO-{num:04d}"

# --- Main Finance Models ---
class Treasury(TimestampMixin):
    name = models.CharField(max_length=100, unique=True)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    def __str__(self): return self.name

class Invoice(TimestampMixin):
    STATUS_CHOICES = [("DRAFT", "Draft"), ("SENT", "Sent"), ("PAID", "Paid"), ("OVERDUE", "Overdue")]
    invoice_number = models.CharField(max_length=20, unique=True, default=next_invoice_number)
    student = models.ForeignKey(Student, on_delete=models.PROTECT, related_name="invoices")
    issue_date = models.DateField()
    due_date = models.DateField()
    description = models.TextField(blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="DRAFT")
    def __str__(self): return self.invoice_number

class Payment(TimestampMixin):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="payments")
    treasury = models.ForeignKey(Treasury, on_delete=models.PROTECT)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    def __str__(self): return f"Payment for {self.invoice.invoice_number}"

class PurchaseOrder(TimestampMixin):
    po_number = models.CharField(max_length=20, unique=True, default=next_po_number, editable=False)
    vendor = models.ForeignKey(Vendor, on_delete=models.PROTECT)
    item = models.ForeignKey(Item, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    order_date = models.DateField()
    received = models.BooleanField(default=False)
    @property
    def total(self): return self.unit_price * self.quantity
    def __str__(self): return self.po_number

class Expense(TimestampMixin):
    CATEGORY_CHOICES = [
        ('UTILITIES', 'Utilities'), ('RENT', 'Rent'), ('SALARIES', 'Salaries'),
        ('SUPPLIES', 'Supplies'), ('MAINTENANCE', 'Maintenance'),
        ('MARKETING', 'Marketing'), ('OTHER', 'Other'),
    ]
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.SET_NULL, null=True, blank=True, related_name="expenses")
    description = models.TextField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    treasury = models.ForeignKey(Treasury, on_delete=models.PROTECT)
    date = models.DateField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='OTHER')
    def __str__(self): return f"EXP-{self.id}: {self.description[:30]}"

class SalaryPayment(TimestampMixin):
    STATUS_CHOICES = [('PENDING', 'Pending'), ('PAID', 'Paid')]
    
    # CORRECT: Links to the new Payslip model from the HR app
    payslip = models.OneToOneField(Payslip, on_delete=models.CASCADE, null=True, blank=True)
    
    treasury = models.ForeignKey(Treasury, on_delete=models.PROTECT, related_name='salary_payments', null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')

    def __str__(self):
        if self.payslip:
            return f"Salary Payment for {self.payslip.payroll_profile.staff.full_name}"
        return f"Salary Payment of {self.amount}"
