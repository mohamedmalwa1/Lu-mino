from django.db import models
from core.models import TimestampMixin
from student.models import Student
from hr.models import SalaryRecord, Staff
from inventory.models import Vendor, Item


# ───────── Treasury ─────────
class Treasury(TimestampMixin):
    """Cash / bank accounts."""
    name    = models.CharField(max_length=100, unique=True)
    balance = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return self.name


class TreasuryTransaction(TimestampMixin):
    """Audit-trail of every inflow/outflow."""
    treasury = models.ForeignKey(Treasury, on_delete=models.PROTECT, related_name="transactions")
    reference = models.CharField(max_length=50, blank=True)  # INV#, EXP#, SAL#
    description = models.TextField(blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    is_inflow = models.BooleanField()        # True = money in, False = money out
    date = models.DateField()

    def __str__(self):
        sign = "+" if self.is_inflow else "-"
        return f"{sign}{self.amount} {self.treasury} {self.reference}"
# ────────────────────────────


# ───────── Accounts Receivable ─────────
def next_invoice_number():
    last = Invoice.objects.order_by("-id").first()
    if not last or not last.invoice_number:
        return "INV-0001"
    num = int(last.invoice_number.split("-")[-1]) + 1
    return f"INV-{num:04d}"


class Invoice(TimestampMixin):
    invoice_number = models.CharField(max_length=20, unique=True, default=next_invoice_number)
    student        = models.ForeignKey(Student, on_delete=models.PROTECT, related_name="invoices")
    issue_date     = models.DateField()
    due_date       = models.DateField()
    description    = models.TextField(blank=True)
    amount         = models.DecimalField(max_digits=10, decimal_places=2)
    STATUS = [("DRAFT", "Draft"), ("SENT", "Sent"), ("PAID", "Paid"), ("OVERDUE", "Overdue")]
    status         = models.CharField(max_length=10, choices=STATUS, default="DRAFT")

    def __str__(self):
        return self.invoice_number


class Payment(TimestampMixin):
    invoice   = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="payments")
    amount    = models.DecimalField(max_digits=10, decimal_places=2)
    treasury  = models.ForeignKey(Treasury, on_delete=models.PROTECT)
    date      = models.DateField()

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Log to treasury
        TreasuryTransaction.objects.get_or_create(
            treasury=self.treasury,
            reference=self.invoice.invoice_number,
            description=f"Invoice payment {self.invoice.invoice_number}",
            amount=self.amount,
            is_inflow=True,
            date=self.date,
        )
# ───────────────────────────────────────


# ───────── Accounts Payable ─────────
class Expense(TimestampMixin):
    reference  = models.CharField(max_length=30, blank=True)   # PO#, etc.
    vendor     = models.ForeignKey(Vendor, on_delete=models.SET_NULL, null=True, blank=True)
    description = models.TextField()
    amount      = models.DecimalField(max_digits=10, decimal_places=2)
    treasury    = models.ForeignKey(Treasury, on_delete=models.PROTECT)
    date        = models.DateField()

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        TreasuryTransaction.objects.get_or_create(
            treasury=self.treasury,
            reference=self.reference or f"EXP-{self.id}",
            description=self.description[:60],
            amount=self.amount,
            is_inflow=False,
            date=self.date,
        )

    def __str__(self):
        return f"EXP-{self.id}"


# ───────── Payroll Payment ─────────
class SalaryPayment(TimestampMixin):
    salary_record = models.ForeignKey(SalaryRecord, on_delete=models.CASCADE, related_name="finance_payments")
    treasury      = models.ForeignKey(Treasury, on_delete=models.PROTECT)
    amount        = models.DecimalField(max_digits=10, decimal_places=2)
    date          = models.DateField()

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        TreasuryTransaction.objects.get_or_create(
            treasury=self.treasury,
            reference=f"SAL-{self.salary_record.id}",
            description=f"Salary {self.salary_record.staff}",
            amount=self.amount,
            is_inflow=False,
            date=self.date,
        )
# ────────────────────────────────────


# ───────── Inventory Purchase Order ─────────
class PurchaseOrder(TimestampMixin):
    po_number  = models.CharField(max_length=20, unique=True)
    vendor     = models.ForeignKey(Vendor, on_delete=models.PROTECT)
    item       = models.ForeignKey(Item, on_delete=models.PROTECT)
    quantity   = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    order_date = models.DateField()
    received   = models.BooleanField(default=False)

    @property
    def total(self):
        return self.unit_price * self.quantity

    def __str__(self):
        return self.po_number




