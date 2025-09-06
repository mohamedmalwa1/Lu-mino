# hr/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Payslip
from finance.models import SalaryPayment # Ensure this import path is correct for your project

@receiver(post_save, sender=Payslip)
def link_payslip_to_finance(sender, instance, created, **kwargs):
    """
    When a new Payslip is created, this signal automatically creates
    a corresponding 'PENDING' SalaryPayment in the finance app.
    """
    if created:
        SalaryPayment.objects.get_or_create(
            payslip=instance, 
            defaults={
                'amount': instance.net_salary,
                'status': 'PENDING'
            }
        )
