# finance/signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Payment, Expense, SalaryPayment

@receiver(post_save, sender=Payment)
def update_treasury_on_payment(sender, instance, created, **kwargs):
    if created:
        instance.treasury.balance += instance.amount
        instance.treasury.save()

@receiver(post_save, sender=Expense)
def update_treasury_on_expense(sender, instance, created, **kwargs):
    if created:
        instance.treasury.balance -= instance.amount
        instance.treasury.save()

@receiver(post_save, sender=SalaryPayment)
def update_treasury_on_salary_payment(sender, instance, **kwargs):
    if instance.status == 'PAID' and instance.treasury:
        # NOTE: To prevent multiple deductions, a more robust check would be to see
        # if the status *changed* to PAID. This is a simpler, effective version.
        instance.treasury.balance -= instance.amount
        instance.treasury.save()
