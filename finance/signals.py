# finance/signals.py
"""
Automation hooks for the Finance domain.

A. Auto-create an Expense (and TreasuryTransaction) whenever a
   PurchaseOrder is flagged as received.
B. Auto-change Invoice.status to "PAID" when cumulative payments
   reach or exceed the invoice amount.
"""
from datetime import date
from decimal import Decimal

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db.models import Sum

from finance.models import (
    PurchaseOrder,
    Expense,
    Treasury,
    TreasuryTransaction,
    Invoice,
    Payment,
)


# ────────────────────────────────────────────────────────────
# Hook A – PurchaseOrder → Expense on receipt
# ────────────────────────────────────────────────────────────
@receiver(post_save, sender=PurchaseOrder)
def auto_expense_on_receipt(sender, instance: PurchaseOrder, **kwargs):
    """
    When a PO is marked 'received' create a matching Expense exactly once.
    """
    if not instance.received:
        return  # Only fire when it's True

    already = Expense.objects.filter(reference=instance.po_number).exists()
    if already:
        return  # Avoid duplicates on repeated saves

    treasury = Treasury.objects.first()  # choose default treasury (customise!)

    expense = Expense.objects.create(
        reference=instance.po_number,
        vendor=instance.vendor,
        description=f"Items from PO {instance.po_number}",
        amount=instance.total,
        treasury=treasury,
        date=date.today(),
    )

    # Expense.save() already logs a TreasuryTransaction via its own save()
    print(f"[AUTO] Expense {expense.id} created for PO {instance.po_number}")


# ────────────────────────────────────────────────────────────
# Hook B – Invoice status auto-update
# ────────────────────────────────────────────────────────────
@receiver(post_save, sender=Payment)
def auto_set_invoice_paid(sender, instance: Payment, **kwargs):
    """
    When a Payment is saved, recalc totals; mark Invoice as PAID if satisfied.
    """
    invoice: Invoice = instance.invoice
    paid_total: Decimal = invoice.payments.aggregate(total=Sum("amount"))["total"] or Decimal("0")

    if paid_total >= invoice.amount and invoice.status != "PAID":
        invoice.status = "PAID"
        invoice.save(update_fields=["status"])
        print(f"[AUTO] Invoice {invoice.invoice_number} set to PAID")

