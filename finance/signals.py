# finance/signals.py (Corrected)

from decimal import Decimal
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db.models import Sum

# Import the main models
from .models import Payment, Invoice

# THE FIX IS HERE: Import the correct, existing task
from .tasks import email_invoice

@receiver(post_save, sender=Payment)
def auto_update_invoice_status_and_email(sender, instance: Payment, created, **kwargs):
    """
    A signal that runs every time a Payment is saved.
    It updates the invoice status and triggers an email if the invoice becomes fully paid.
    """
    if not created:
        return # Only run this logic when a payment is first created

    invoice: Invoice = instance.invoice
    
    # Calculate the total amount paid for the invoice
    paid_total = invoice.payments.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
    
    # Check if the invoice is now fully paid
    if paid_total >= invoice.amount and invoice.status != "PAID":
        # Update the status
        invoice.status = "PAID"
        invoice.save(update_fields=["status"])
        
        # Trigger the background task to email the now-paid invoice
        email_invoice.delay(invoice.id)
