# finance/signals.py - COMPLETE FIXED VERSION
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import F
from django.apps import apps  # ← ADD THIS
import logging  # ← ADD THIS

from .models import Payment, Expense, SalaryPayment, Treasury, Invoice
from .tasks import email_invoice

logger = logging.getLogger(__name__)  # ← ADD THIS

@receiver([post_save, post_delete], sender=Payment)
def update_treasury_on_payment(sender, instance, **kwargs):
    # This logic runs when a Payment is created or deleted
    if kwargs.get('created', True): # True on create, not present on delete
        Treasury.objects.filter(id=instance.treasury.id).update(balance=F('balance') + instance.amount)
    else: # This is a delete signal
        Treasury.objects.filter(id=instance.treasury.id).update(balance=F('balance') - instance.amount)

@receiver([post_save, post_delete], sender=Expense)
def update_treasury_on_expense(sender, instance, **kwargs):
    # This logic runs when an Expense is created or deleted
    if kwargs.get('created', True):
        Treasury.objects.filter(id=instance.treasury.id).update(balance=F('balance') - instance.amount)
    else:
        Treasury.objects.filter(id=instance.treasury.id).update(balance=F('balance') + instance.amount)

@receiver([post_save, post_delete], sender=SalaryPayment)
def update_treasury_on_salary(sender, instance, **kwargs):
    # This logic runs when a SalaryPayment is created or deleted
    if kwargs.get('created', True):
        Treasury.objects.filter(id=instance.treasury.id).update(balance=F('balance') - instance.amount)
    else:
        Treasury.objects.filter(id=instance.treasury.id).update(balance=F('balance') + instance.amount)

@receiver(post_save, sender=SalaryPayment)
def mark_salary_record_as_paid(sender, instance, created, **kwargs):
    """
    When a salary payment is created, find the related salary record
    and mark its 'paid' field as True.
    """
    if created:
        # Use lazy loading to avoid circular imports
        SalaryRecord = apps.get_model('hr', 'SalaryRecord')
        salary_record = instance.salary_record
        if salary_record:
            salary_record.paid = True
            salary_record.save()
            logger.info(f"Marked salary record {salary_record.id} as paid for staff {salary_record.staff.full_name}")

@receiver(post_save, sender=Payment)
def update_invoice_status_on_payment(sender, instance, created, **kwargs):
    """
    Automatically update invoice status when payments are made
    """
    if created:
        invoice = instance.invoice
        new_status = invoice.update_status_based_on_payments()
        
        # If invoice just became PAID, trigger email
        if new_status == 'PAID':
            email_invoice.delay(invoice.id)

@receiver(post_delete, sender=Payment)
def update_invoice_status_on_payment_delete(sender, instance, **kwargs):
    """
    Update invoice status when payments are deleted
    """
    invoice = instance.invoice
    invoice.update_status_based_on_payments()
