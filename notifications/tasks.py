from celery import shared_task
from datetime import date, timedelta
from django.db.models import F
from django.utils import timezone

from inventory.models import Item
from student.models import StudentDocument
from hr.models import StaffDocument, PayrollContract
from notifications.utils import send_html_mail


@shared_task
def low_stock_alert():
    items = Item.objects.filter(quantity__lte=F("reorder_level")).order_by("name")
    if not items.exists():
        return "No low-stock items"

    send_html_mail(
        "Low Stock Alert",
        "emails/low_stock.html",
        {"items": items, "today": date.today()},
    )
    return f"Sent for {items.count()} item(s)"


@shared_task
def id_expiry_alert():
    cutoff = date.today() + timedelta(days=30)
    student_docs = StudentDocument.objects.filter(expiration_date__lte=cutoff)
    staff_docs   = StaffDocument.objects.filter(expiration_date__lte=cutoff)

    if student_docs or staff_docs:
        send_html_mail(
            "ID / Document Expiry Alert",
            "emails/id_expiry.html",
            {
                "student_docs": student_docs,
                "staff_docs": staff_docs,
                "cutoff": cutoff,
            },
        )
        return "Expiry mail sent"
    return "No expiring docs"


@shared_task
def contract_expiry_alert():
    cutoff = date.today() + timedelta(days=30)
    contracts = PayrollContract.objects.filter(contract_end__lte=cutoff)

    if contracts.exists():
        send_html_mail(
            "Payroll Contract Expiry Alert",
            "emails/contract_expiry.html",
            {"contracts": contracts, "cutoff": cutoff},
        )
        return f"Sent for {contracts.count()} contracts"
    return "No expiring contracts"

