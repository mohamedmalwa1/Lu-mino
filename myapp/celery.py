# myapp/celery.py
import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "myapp.settings")
app = Celery("myapp")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

# COMBINE ALL SCHEDULES INTO ONE beat_schedule
app.conf.beat_schedule = {
    'generate-monthly-salary-records': {
        'task': 'hr.tasks.generate_monthly_salary_records',
        'schedule': crontab(day_of_month='1', hour=0, minute=0),
    },
    'ensure-daily-salary-records': {
        'task': 'hr.tasks.ensure_daily_salary_records',
        'schedule': crontab(hour=1, minute=0),
    },
    'generate-monthly-invoices': {
        'task': 'finance.tasks.generate_monthly_invoices_for_active_students',
        'schedule': crontab(day_of_month='1', hour=6, minute=0),
    },
}
# REMOVE this line: app.conf.timezone = 'Asia/Dubai'
