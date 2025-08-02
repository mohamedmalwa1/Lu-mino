from celery import shared_task
from django.utils import timezone
from datetime import date

from hr.models import Staff, SalaryRecord


@shared_task
def generate_monthly_salary_records():
    """
    On the 1st of each month create a SalaryRecord for every active staff
    if one doesn't already exist.
    """
    first_day = timezone.now().date().replace(day=1)

    for staff in Staff.objects.filter(is_active=True):
        if not SalaryRecord.objects.filter(staff=staff, month=first_day).exists():
            gross = staff.payrollcontract.base_salary  # adjust if field differs
            SalaryRecord.objects.create(
                staff=staff,
                month=first_day,
                gross=gross,
                net=gross,
            )

