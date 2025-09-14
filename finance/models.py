# finance/models.py
from django.db import models
from core.models import TimestampMixin
from student.models import Student
from inventory.models import Vendor, Item
from hr.models import SalaryRecord
from django.utils import timezone
# Helper Functions
def next_invoice_number():
    last = Invoice.objects.order_by("-id").first()
    if not last or not last.invoice_number: return "INV-0001"
    num = int(last.invoice_number.split("-")[-1]) + 1
    return f"INV-{num:04d}"

def next_po_number():
    last = PurchaseOrder.objects.order_by("-id").first()
    if not last or not last.po_number: return "PO-0001"
    num = int(last.po_number.split("-")[-1]) + 1
    return f"PO-{num:04d}"

# Models
class Treasury(TimestampMixin):
    name    = models.CharField(max_length=100, unique=True)
    balance = models.DecimalField(max_digits=12, decimal_places=2)
    def __str__(self): return self.name

class TreasuryTransaction(TimestampMixin):
    treasury = models.ForeignKey('Treasury', on_delete=models.PROTECT, related_name="transactions")
    reference = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    is_inflow = models.BooleanField()
    date = models.DateField()
    def __str__(self):
        sign = "+" if self.is_inflow else "-"
        return f"{sign}{self.amount} {self.treasury} {self.reference}"

class Invoice(TimestampMixin):
    invoice_number = models.CharField(max_length=20, unique=True, default=next_invoice_number)
    student        = models.ForeignKey(Student, on_delete=models.PROTECT, related_name="invoices")
    issue_date     = models.DateField()
    due_date       = models.DateField()
    description    = models.TextField(blank=True)
    amount         = models.DecimalField(max_digits=10, decimal_places=2)
    STATUS = [
        ("DRAFT", "Draft"), 
        ("SENT", "Sent"), 
        ("PARTIAL", "Partially Paid"), 
        ("PAID", "Paid"), 
        ("OVERDUE", "Overdue")
    ]
    status = models.CharField(max_length=10, choices=STATUS, default="DRAFT")
    
    def __str__(self): 
        return self.invoice_number
    
    def update_status_based_on_payments(self):
        """Update invoice status based on payment amounts"""
        paid_total = self.payments.aggregate(total=models.Sum('amount'))['total'] or Decimal('0.00')
        
        if paid_total >= self.amount:
            self.status = 'PAID'
        elif paid_total > Decimal('0.00'):
            self.status = 'PARTIAL'  # Changed from SENT to PARTIAL
        elif self.status != 'DRAFT':
            self.status = 'SENT'
        else:
            self.status = 'DRAFT'
        
        # Check if overdue for non-paid invoices
        if self.status in ['SENT', 'PARTIAL'] and self.due_date < timezone.now().date():
            self.status = 'OVERDUE'
        
        self.save()
        return self.status
    

class Payment(TimestampMixin):
    invoice   = models.ForeignKey('Invoice', on_delete=models.CASCADE, related_name="payments")
    amount    = models.DecimalField(max_digits=10, decimal_places=2)
    treasury  = models.ForeignKey('Treasury', on_delete=models.PROTECT)
    date      = models.DateField()

class PurchaseOrder(TimestampMixin):
    po_number  = models.CharField(max_length=20, unique=True, default=next_po_number, editable=False)
    vendor     = models.ForeignKey(Vendor, on_delete=models.PROTECT)
    item       = models.ForeignKey(Item, on_delete=models.PROTECT)
    quantity   = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    order_date = models.DateField()
    received   = models.BooleanField(default=False)
    @property
    def total(self): return self.unit_price * self.quantity
    def __str__(self): return self.po_number

class Expense(TimestampMixin):
    purchase_order = models.ForeignKey('PurchaseOrder', on_delete=models.SET_NULL, null=True, blank=True, related_name="expenses")
    reference  = models.CharField(max_length=30, blank=True)
    vendor     = models.ForeignKey(Vendor, on_delete=models.SET_NULL, null=True, blank=True)
    description = models.TextField()
    amount      = models.DecimalField(max_digits=10, decimal_places=2)
    treasury    = models.ForeignKey('Treasury', on_delete=models.PROTECT)
    date        = models.DateField()
    CATEGORY = [
        ('UTILITIES', 'Utilities'), ('RENT', 'Rent'), ('SALARIES', 'Salaries'),
        ('SUPPLIES', 'Supplies'), ('MAINTENANCE', 'Maintenance'),
        ('MARKETING', 'Marketing'), ('OTHER', 'Other'),
    ]
    category = models.CharField(max_length=20, choices=CATEGORY, default='OTHER')
    def __str__(self): return f"EXP-{self.id}: {self.description[:30]}"

class SalaryPayment(TimestampMixin):
    # --- ADD THIS FIELD TO CREATE THE LINK ---
    salary_record = models.ForeignKey(SalaryRecord, on_delete=models.CASCADE, related_name="finance_payments")
    
    treasury      = models.ForeignKey('Treasury', on_delete=models.PROTECT)
    amount        = models.DecimalField(max_digits=10, decimal_places=2)
    date          = models.DateField()
    
    def __str__(self):
        return f"Salary Payment for {self.salary_record.staff.full_name} - {self.amount}"

