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

# --- Helper Functions ---
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

# --- PDF Generation Tasks ---
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

@shared_task
def generate_purchase_order_pdf(po_id: int):
    PurchaseOrder = _get_model("finance", "PurchaseOrder")
    if not PurchaseOrder: return None
    try:
        po = PurchaseOrder.objects.select_related("vendor", "item").get(pk=po_id)
        context = { "po": po }
        return _render_pdf("finance/po_template.html", context)
    except PurchaseOrder.DoesNotExist:
        logger.error(f"Purchase Order with ID {po_id} not found.")
        return None

# --- Emailing Tasks ---
@shared_task(bind=True, max_retries=3)
def email_invoice(self, invoice_id: int, to_override: Optional[list[str]] = None):
    Invoice = _get_model("finance", "Invoice")
    if not Invoice: return "Failed: Invoice model not found."
    try:
        invoice = Invoice.objects.get(pk=invoice_id)
        contact_name, contact_email = _get_invoice_contact_details(invoice)
        recipients = to_override or ([contact_email] if contact_email else [])
        if not recipients:
            logger.error(f"No recipient email found for Invoice ID: {invoice_id}.")
            return f"Failed: No recipient for Invoice {invoice.invoice_number}"

        pdf_data = generate_invoice_pdf(invoice_id)
        if not pdf_data:
            logger.error(f"Failed to generate PDF for Invoice ID: {invoice_id}.")
            return f"Failed: PDF generation for Invoice {invoice.invoice_number}"

        subject = f"Invoice {invoice.invoice_number} from Lu-mino"
        body = f"Dear {contact_name},\n\nPlease find your attached invoice.\n\nThank you,\nLu-mino Education ERP"
        from_email = settings.DEFAULT_FROM_EMAIL
        
        email = EmailMessage(subject, body, from_email, recipients)
        email.attach(f"Invoice-{invoice.invoice_number}.pdf", pdf_data, "application/pdf")
        email.send(fail_silently=False)
        return f"Successfully emailed Invoice {invoice.invoice_number}"
    except Exception as e:
        logger.error(f"Error emailing invoice {invoice_id}: {e}")
        raise self.retry(exc=e, countdown=60)

@shared_task(bind=True, max_retries=3)
def email_payment_receipt(self, payment_id: int, to_override: Optional[list[str]] = None):
    Payment = _get_model("finance", "Payment")
    if not Payment: return "Failed: Payment model not found."
    try:
        payment = Payment.objects.get(pk=payment_id)
        invoice = payment.invoice
        contact_name, contact_email = _get_invoice_contact_details(invoice)
        recipients = to_override or ([contact_email] if contact_email else [])
        if not recipients:
            logger.error(f"No recipient found for payment {payment_id}")
            return f"Failed: No recipient for Payment {payment.id}"

        pdf_data = generate_payment_receipt_pdf(payment_id)
        if not pdf_data:
            logger.error(f"Failed to generate PDF for payment {payment_id}")
            return f"Failed: PDF generation for Payment {payment.id}"
            
        subject = f"Payment Receipt for Invoice {invoice.invoice_number}"
        body = f"Dear {contact_name},\n\nThank you for your payment. Your receipt is attached.\n\nThank you,\nLu-mino ERP"
        from_email = settings.DEFAULT_FROM_EMAIL
        
        email = EmailMessage(subject, body, from_email, recipients)
        email.attach(f"Receipt-{invoice.invoice_number}.pdf", pdf_data, "application/pdf")
        email.send(fail_silently=False)
        return f"Successfully emailed Receipt for Payment {payment.id}"
    except Exception as e:
        logger.error(f"Error emailing payment receipt {payment_id}: {e}")
        raise self.retry(exc=e, countdown=60)
