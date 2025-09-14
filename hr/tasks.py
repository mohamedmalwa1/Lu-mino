# hr/tasks.py

from celery import shared_task
from django.utils import timezone
from django.db import transaction
from hr.models import Staff, SalaryRecord, PayrollContract
import logging

logger = logging.getLogger(__name__)

@shared_task
def generate_monthly_salary_records():
    """
    On the 1st of each month, create a SalaryRecord for every active staff
    member who has a contract.
    """
    try:
        current_time = timezone.now()
        first_day = current_time.date().replace(day=1)
        
        logger.info(f"🚀 Starting monthly salary generation for {first_day}")
        logger.info(f"Current server time: {current_time}")
        logger.info(f"Timezone: {timezone.get_current_timezone_name()}")

        active_staff_with_contracts = Staff.objects.filter(
            is_active=True, 
            contract__isnull=False
        ).select_related('contract')

        logger.info(f"Found {active_staff_with_contracts.count()} active staff with contracts")

        if active_staff_with_contracts.count() == 0:
            logger.warning("❌ No active staff with contracts found!")
            return "No active staff with contracts"

        records_created = 0
        errors = 0

        for staff in active_staff_with_contracts:
            try:
                # Check if a record for this month already exists
                if SalaryRecord.objects.filter(staff=staff, month=first_day).exists():
                    logger.debug(f"⏩ Salary record already exists for {staff.full_name} - {first_day}")
                    continue

                contract = staff.contract
                gross = contract.base_salary + contract.allowance
                
                with transaction.atomic():
                    salary_record = SalaryRecord.objects.create(
                        staff=staff,
                        month=first_day,
                        gross=gross,
                        deduct=0,
                        # REMOVE net=gross - Let the model's save() method calculate it automatically!
                        paid=False
                    )
                
                records_created += 1
                logger.info(f"✅ Created salary record for {staff.full_name} - Gross: {gross}, Net: {salary_record.net} (ID: {salary_record.id})")

            except Exception as e:
                errors += 1
                logger.error(f"❌ Error creating salary record for {staff.full_name}: {str(e)}")
                continue

        logger.info(f"🎉 Salary generation completed. Created: {records_created}, Errors: {errors}")
        return f"Created {records_created} records, {errors} errors"

    except Exception as e:
        logger.error(f"💥 Failed to generate monthly salaries: {str(e)}")
        raise


@shared_task
def generate_missing_salary_records():
    """
    One-time task to generate missing salary records for current month.
    Can be called manually to fix existing data.
    """
    try:
        current_month = timezone.now().date().replace(day=1)
        logger.info(f"🔧 Generating missing salary records for {current_month}")
        
        active_staff_with_contracts = Staff.objects.filter(
            is_active=True, 
            contract__isnull=False
        ).select_related('contract')

        records_created = 0

        for staff in active_staff_with_contracts:
            if not SalaryRecord.objects.filter(staff=staff, month=current_month).exists():
                contract = staff.contract
                gross = contract.base_salary + contract.allowance
                
                salary_record = SalaryRecord.objects.create(
                    staff=staff,
                    month=current_month,
                    gross=gross,
                    deduct=0,
                    # REMOVE net=gross - Let the model calculate it!
                    paid=False
                )
                records_created += 1
                logger.info(f"✅ Created missing record for {staff.full_name} - Net: {salary_record.net}")

        logger.info(f"🎉 Missing records generation completed. Created: {records_created}")
        return f"Created {records_created} missing records"

    except Exception as e:
        logger.error(f"💥 Failed to generate missing salaries: {str(e)}")
        raise


@shared_task
def ensure_daily_salary_records():
    """
    Daily task to ensure all active staff with contracts have salary records
    for the current month. This catches new staff added during the month.
    """
    try:
        current_month = timezone.now().date().replace(day=1)
        logger.info(f"📅 Daily check for salary records - {current_month}")
        
        active_staff_with_contracts = Staff.objects.filter(
            is_active=True, 
            contract__isnull=False
        ).select_related('contract')

        records_created = 0

        for staff in active_staff_with_contracts:
            if not SalaryRecord.objects.filter(staff=staff, month=current_month).exists():
                contract = staff.contract
                gross = contract.base_salary + contract.allowance
                
                salary_record = SalaryRecord.objects.create(
                    staff=staff,
                    month=current_month,
                    gross=gross,
                    deduct=0,
                    # REMOVE net=gross - Let the model calculate it!
                    paid=False
                )
                records_created += 1
                logger.info(f"✅ Created daily record for {staff.full_name} - Net: {salary_record.net}")

        if records_created == 0:
            logger.info("✅ All staff have salary records for current month")
        else:
            logger.info(f"✅ Created {records_created} new daily records")

        return f"Created {records_created} daily records"

    except Exception as e:
        logger.error(f"💥 Daily salary check failed: {str(e)}")
        raise


@shared_task
def test_timezone():
    """Test task to check timezone configuration"""
    current_time = timezone.now()
    logger.info(f"⏰ Timezone test: {current_time}")
    logger.info(f"🌍 Timezone name: {timezone.get_current_timezone_name()}")
    return f"Current time: {current_time}, Timezone: {timezone.get_current_timezone_name()}"
