# finance/tasks.py

import logging
from typing import Optional
from celery import shared_task
from decimal import Decimal

from django.conf import settings
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.apps import apps
from django.db.models import Sum
from weasyprint import HTML

logger = logging.getLogger(__name__)

def _get_model(app_label: str, model_name: str):
    try:
        return apps.get_model(app_label, model_name)
    except LookupError:
        logger.error(f"Model {app_label}.{model_name} not found.")
        return None

def _get_invoice_contact_details(invoice):
    if hasattr(invoice, "student") and invoice.student:
        student = invoice.student
        name = getattr(student, "guardian_name", student.name)
        email = getattr(student, "guardian_email", None)
        return name, email
    return "Valued Customer", None

def _render_pdf(template_path, context):
    html_string = render_to_string(template_path, context)
    return HTML(string=html_string, base_url=str(settings.BASE_DIR)).write_pdf()

@shared_task
def generate_invoice_pdf(invoice_id: int):
    Invoice = _get_model("finance", "Invoice")
    if not Invoice: return None
    try:
        invoice = Invoice.objects.select_related("student").get(pk=invoice_id)
        paid_total = invoice.payments.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
        context = {
            "invoice": invoice,
            "student": invoice.student,
            "paid_total": paid_total,
            "balance": invoice.amount - paid_total,
        }
        return _render_pdf("finance/invoice_template.html", context)
    except Invoice.DoesNotExist:
        logger.error(f"Invoice with ID {invoice_id} not found.")
        return None

@shared_task
def generate_payment_receipt_pdf(payment_id: int):
    Payment = _get_model("finance", "Payment")
    if not Payment: return None
    try:
        payment = Payment.objects.select_related("invoice__student").get(pk=payment_id)
        invoice = payment.invoice
        paid_total = invoice.payments.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
        context = {
            "payment": payment,
            "invoice": invoice,
            "student": invoice.student,
            "paid_total": paid_total,
            "balance": invoice.amount - paid_total,
        }
        return _render_pdf("finance/payment_receipt_template.html", context)
    except Payment.DoesNotExist:
        logger.error(f"Payment with ID {payment_id} not found.")
        return None

@shared_task(bind=True, max_retries=3)
def email_invoice(self, invoice_id: int, to_override: Optional[list[str]] = None):
    # ... (email logic as provided previously)
    pass

@shared_task(bind=True, max_retries=3)
def email_payment_receipt(self, payment_id: int, to_override: Optional[list[str]] = None):
    # ... (email logic as provided previously)
    pass
