# finance/tasks.py
import logging
from typing import Optional
from celery import shared_task
from decimal import Decimal
from datetime import date, timedelta

from django.conf import settings
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.apps import apps
from django.db.models import Sum, Q
from django.utils import timezone
from weasyprint import HTML

logger = logging.getLogger(__name__)

# --- Helper Functions ---
def _get_model(app_label: str, model_name: str):
    """Safely get model by app label and model name"""
    try:
        return apps.get_model(app_label, model_name)
    except LookupError:
        logger.error(f"Model {app_label}.{model_name} not found.")
        return None

def _get_invoice_contact_details(invoice):
    """Get contact details for invoice recipient"""
    if hasattr(invoice, "student") and invoice.student:
        student = invoice.student
        # Try to get guardian details first, fall back to student details
        name = getattr(student, "guardian_name", None) or getattr(student, "name", "Valued Customer")
        email = getattr(student, "guardian_email", None) or getattr(student, "email", None)
        return name, email
    return "Valued Customer", None

def _render_pdf(template_path, context):
    """Render HTML template to PDF"""
    try:
        html_string = render_to_string(template_path, context)
        return HTML(string=html_string, base_url=str(settings.BASE_DIR)).write_pdf()
    except Exception as e:
        logger.error(f"Error rendering PDF: {e}")
        return None

def _get_default_invoice_amount(student):
    """Get default invoice amount based on student grade or other criteria"""
    # You can customize this based on your business logic
    # Example: different amounts for different grades
    grade = getattr(student, 'grade', None)
    if grade == '12':
        return Decimal('1200.00')
    elif grade == '11':
        return Decimal('1100.00')
    elif grade == '10':
        return Decimal('1000.00')
    else:
        return Decimal('800.00')

# --- PDF Generation Tasks ---
@shared_task
def generate_invoice_pdf(invoice_id: int):
    """Generate PDF for a specific invoice"""
    Invoice = _get_model("finance", "Invoice")
    if not Invoice:
        logger.error("Invoice model not found")
        return None
    
    try:
        invoice = Invoice.objects.select_related("student").get(pk=invoice_id)
        paid_total = invoice.payments.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
        
        context = {
            "invoice": invoice,
            "student": invoice.student,
            "paid_total": paid_total,
            "balance": invoice.amount - paid_total,
            "status_display": invoice.get_status_display(),
            "company_name": "Lu-mino Education",
            "company_address": "123 Education Street, Dubai, UAE",
            "company_phone": "+971 4 123 4567",
            "company_email": "accounts@luminoschool.com",
        }
        
        pdf_data = _render_pdf("finance/invoice_template.html", context)
        if not pdf_data:
            logger.error(f"Failed to render PDF for invoice {invoice_id}")
        
        return pdf_data
        
    except Invoice.DoesNotExist:
        logger.error(f"Invoice with ID {invoice_id} not found.")
        return None
    except Exception as e:
        logger.error(f"Error generating invoice PDF {invoice_id}: {e}")
        return None

@shared_task
def generate_payment_receipt_pdf(payment_id: int):
    """Generate PDF receipt for a payment"""
    Payment = _get_model("finance", "Payment")
    if not Payment:
        logger.error("Payment model not found")
        return None
    
    try:
        payment = Payment.objects.select_related("invoice__student", "treasury").get(pk=payment_id)
        invoice = payment.invoice
        paid_total = invoice.payments.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
        
        context = {
            "payment": payment,
            "invoice": invoice,
            "student": invoice.student,
            "paid_total": paid_total,
            "balance": invoice.amount - paid_total,
            "treasury": payment.treasury,
            "company_name": "Lu-mino Education",
            "company_address": "123 Education Street, Dubai, UAE",
            "company_phone": "+971 4 123 4567",
        }
        
        pdf_data = _render_pdf("finance/payment_receipt_template.html", context)
        if not pdf_data:
            logger.error(f"Failed to render PDF for payment {payment_id}")
        
        return pdf_data
        
    except Payment.DoesNotExist:
        logger.error(f"Payment with ID {payment_id} not found.")
        return None
    except Exception as e:
        logger.error(f"Error generating payment receipt PDF {payment_id}: {e}")
        return None

@shared_task
def generate_purchase_order_pdf(po_id: int):
    """Generate PDF for a purchase order"""
    PurchaseOrder = _get_model("finance", "PurchaseOrder")
    if not PurchaseOrder:
        logger.error("PurchaseOrder model not found")
        return None
    
    try:
        po = PurchaseOrder.objects.select_related("vendor", "item").get(pk=po_id)
        
        context = {
            "po": po,
            "vendor": po.vendor,
            "item": po.item,
            "company_name": "Lu-mino Education",
            "company_address": "123 Education Street, Dubai, UAE",
        }
        
        pdf_data = _render_pdf("finance/po_template.html", context)
        if not pdf_data:
            logger.error(f"Failed to render PDF for PO {po_id}")
        
        return pdf_data
        
    except PurchaseOrder.DoesNotExist:
        logger.error(f"Purchase Order with ID {po_id} not found.")
        return None
    except Exception as e:
        logger.error(f"Error generating PO PDF {po_id}: {e}")
        return None

# --- Emailing Tasks ---
@shared_task(bind=True, max_retries=3)
def email_invoice(self, invoice_id: int, to_override: Optional[list[str]] = None):
    """Email invoice to student/guardian"""
    Invoice = _get_model("finance", "Invoice")
    if not Invoice:
        return "Failed: Invoice model not found."
    
    try:
        invoice = Invoice.objects.select_related("student").get(pk=invoice_id)
        contact_name, contact_email = _get_invoice_contact_details(invoice)
        
        # Use override emails or fall back to contact email
        recipients = to_override or ([contact_email] if contact_email else [])
        if not recipients:
            logger.error(f"No recipient email found for Invoice ID: {invoice_id}.")
            return f"Failed: No recipient for Invoice {invoice.invoice_number}"

        # Generate PDF
        pdf_data = generate_invoice_pdf(invoice_id)
        if not pdf_data:
            logger.error(f"Failed to generate PDF for Invoice ID: {invoice_id}.")
            return f"Failed: PDF generation for Invoice {invoice.invoice_number}"

        # Customize email based on invoice status
        if invoice.status == 'PAID':
            subject = f"Paid Invoice {invoice.invoice_number} - Lu-mino Education"
            body = f"""Dear {contact_name},

Thank you for your payment. Invoice #{invoice.invoice_number} is now marked as paid.

Amount: {invoice.amount} AED
Payment Date: {timezone.now().strftime('%Y-%m-%d')}

Thank you for choosing Lu-mino Education.

Best regards,
Accounts Department
Lu-mino Education ERP
"""
        else:
            subject = f"Invoice {invoice.invoice_number} - Payment Due - Lu-mino Education"
            body = f"""Dear {contact_name},

Please find your attached invoice for {invoice.description}.

Invoice Number: {invoice.invoice_number}
Amount Due: {invoice.amount} AED
Due Date: {invoice.due_date}

Please make payment by the due date to avoid late fees.

Thank you,
Accounts Department
Lu-mino Education ERP
"""

        from_email = settings.DEFAULT_FROM_EMAIL
        
        # Create and send email
        email = EmailMessage(subject, body, from_email, recipients)
        email.attach(f"Invoice-{invoice.invoice_number}.pdf", pdf_data, "application/pdf")
        email.send(fail_silently=False)
        
        logger.info(f"Successfully emailed Invoice {invoice.invoice_number} to {recipients}")
        return f"Successfully emailed Invoice {invoice.invoice_number}"
        
    except Exception as e:
        logger.error(f"Error emailing invoice {invoice_id}: {e}")
        raise self.retry(exc=e, countdown=60)

@shared_task(bind=True, max_retries=3)
def email_payment_receipt(self, payment_id: int, to_override: Optional[list[str]] = None):
    """Email payment receipt to student/guardian"""
    Payment = _get_model("finance", "Payment")
    if not Payment:
        return "Failed: Payment model not found."
    
    try:
        payment = Payment.objects.select_related("invoice__student", "treasury").get(pk=payment_id)
        invoice = payment.invoice
        contact_name, contact_email = _get_invoice_contact_details(invoice)
        
        recipients = to_override or ([contact_email] if contact_email else [])
        if not recipients:
            logger.error(f"No recipient found for payment {payment_id}")
            return f"Failed: No recipient for Payment {payment.id}"

        # Generate PDF receipt
        pdf_data = generate_payment_receipt_pdf(payment_id)
        if not pdf_data:
            logger.error(f"Failed to generate PDF for payment {payment_id}")
            return f"Failed: PDF generation for Payment {payment.id}"
            
        subject = f"Payment Receipt for Invoice {invoice.invoice_number} - Lu-mino Education"
        body = f"""Dear {contact_name},

Thank you for your payment. Your receipt is attached.

Payment Details:
- Invoice: {invoice.invoice_number}
- Amount: {payment.amount} AED
- Date: {payment.date}
- Payment Method: Bank Transfer

Thank you for your prompt payment.

Best regards,
Accounts Department
Lu-mino Education ERP
"""

        from_email = settings.DEFAULT_FROM_EMAIL
        
        email = EmailMessage(subject, body, from_email, recipients)
        email.attach(f"Receipt-{invoice.invoice_number}.pdf", pdf_data, "application/pdf")
        email.send(fail_silently=False)
        
        logger.info(f"Successfully emailed receipt for Payment {payment.id}")
        return f"Successfully emailed Receipt for Payment {payment.id}"
        
    except Exception as e:
        logger.error(f"Error emailing payment receipt {payment_id}: {e}")
        raise self.retry(exc=e, countdown=60)

# --- Automation Tasks ---
@shared_task
def generate_monthly_invoices_for_active_students():
    """
    Generate invoices for all active students at the beginning of each month
    """
    Student = _get_model("student", "Student")
    Invoice = _get_model("finance", "Invoice")
    
    if not Student or not Invoice:
        logger.error("Required models not found for monthly invoice generation")
        return "Failed: Models not found"
    
    try:
        # Get all active students
        active_students = Student.objects.filter(is_active=True)
        created_count = 0
        emailed_count = 0
        
        current_date = timezone.now().date()
        first_of_month = current_date.replace(day=1)
        due_date = first_of_month.replace(day=15)  # Due on 15th
        
        # If it's after the 15th, set due date to next month 15th
        if current_date.day > 15:
            next_month = first_of_month + timedelta(days=32)
            first_of_month = next_month.replace(day=1)
            due_date = first_of_month.replace(day=15)
        
        for student in active_students:
            # Check if student already has an invoice for this billing period
            existing_invoice = Invoice.objects.filter(
                student=student,
                issue_date__month=first_of_month.month,
                issue_date__year=first_of_month.year,
                description__icontains=first_of_month.strftime('%B %Y')
            ).first()
            
            if existing_invoice:
                logger.info(f"Invoice already exists for student {student.id} for {first_of_month.strftime('%B %Y')}")
                continue
            
            # Get appropriate amount based on student
            amount = _get_default_invoice_amount(student)
            
            # Create new invoice
            invoice = Invoice.objects.create(
                student=student,
                issue_date=first_of_month,
                due_date=due_date,
                description=f"Monthly tuition fee for {first_of_month.strftime('%B %Y')}",
                amount=amount,
                status='SENT'  # Automatically mark as sent
            )
            
            created_count += 1
            logger.info(f"Created invoice {invoice.invoice_number} for student {student.name}")
            
            # Email the invoice immediately
            try:
                email_invoice.delay(invoice.id)
                emailed_count += 1
                logger.info(f"Scheduled email for invoice {invoice.invoice_number}")
            except Exception as e:
                logger.error(f"Failed to schedule email for invoice {invoice.id}: {e}")
        
        result = f"Created {created_count} invoices, scheduled {emailed_count} emails"
        logger.info(result)
        return result
        
    except Exception as e:
        error_msg = f"Error generating monthly invoices: {e}"
        logger.error(error_msg)
        return f"Failed: {error_msg}"

@shared_task
def check_overdue_invoices():
    """Check and mark overdue invoices daily"""
    Invoice = _get_model("finance", "Invoice")
    if not Invoice:
        return "Failed: Invoice model not found"
    
    try:
        today = timezone.now().date()
        overdue_invoices = Invoice.objects.filter(
            Q(status='SENT') | Q(status='PARTIAL'),
            due_date__lt=today
        )
        
        updated_count = overdue_invoices.update(status='OVERDUE')
        
        result = f"Marked {updated_count} invoices as overdue"
        logger.info(result)
        return result
        
    except Exception as e:
        error_msg = f"Error checking overdue invoices: {e}"
        logger.error(error_msg)
        return f"Failed: {error_msg}"

@shared_task
def send_invoice_reminders():
    """Send reminder emails for overdue or upcoming due invoices"""
    Invoice = _get_model("finance", "Invoice")
    if not Invoice:
        return "Failed: Invoice model not found"
    
    try:
        today = timezone.now().date()
        reminder_invoices = Invoice.objects.filter(
            Q(status='SENT') | Q(status='PARTIAL') | Q(status='OVERDUE'),
            due_date__lte=today + timedelta(days=3),  # Due in next 3 days or overdue
            reminder_count__lt=3  # Max 3 reminders
        )
        
        sent_count = 0
        for invoice in reminder_invoices:
            try:
                # Custom reminder email
                contact_name, contact_email = _get_invoice_contact_details(invoice)
                if not contact_email:
                    continue
                
                subject = f"Reminder: Invoice {invoice.invoice_number} - Payment Due"
                body = f"""Dear {contact_name},

This is a friendly reminder that your invoice #{invoice.invoice_number} is {'overdue' if invoice.status == 'OVERDUE' else 'due soon'}.

Invoice Details:
- Amount: {invoice.amount} AED
- Due Date: {invoice.due_date}
- Current Status: {invoice.get_status_display()}

Please make payment at your earliest convenience.

Thank you,
Accounts Department
Lu-mino Education ERP
"""

                from_email = settings.DEFAULT_FROM_EMAIL
                email = EmailMessage(subject, body, from_email, [contact_email])
                email.send(fail_silently=False)
                
                # Update reminder count
                invoice.reminder_count += 1
                invoice.save(update_fields=['reminder_count'])
                
                sent_count += 1
                logger.info(f"Sent reminder for invoice {invoice.invoice_number}")
                
            except Exception as e:
                logger.error(f"Failed to send reminder for invoice {invoice.id}: {e}")
        
        result = f"Sent {sent_count} invoice reminders"
        logger.info(result)
        return result
        
    except Exception as e:
        error_msg = f"Error sending invoice reminders: {e}"
        logger.error(error_msg)
        return f"Failed: {error_msg}"

@shared_task
def generate_finance_reports():
    """Generate daily finance reports"""
    try:
        # Get today's transactions summary
        today = timezone.now().date()
        
        # Get models
        Payment = _get_model("finance", "Payment")
        Expense = _get_model("finance", "Expense")
        Invoice = _get_model("finance", "Invoice")
        
        if not all([Payment, Expense, Invoice]):
            return "Failed: Finance models not found"
        
        # Calculate daily totals
        daily_payments = Payment.objects.filter(date=today).aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')
        
        daily_expenses = Expense.objects.filter(date=today).aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')
        
        # Count new invoices
        new_invoices = Invoice.objects.filter(issue_date=today).count()
        
        # Prepare report
        report = f"""
Daily Finance Report - {today}
================================
Total Payments: {daily_payments} AED
Total Expenses: {daily_expenses} AED
Net Cash Flow: {daily_payments - daily_expenses} AED
New Invoices: {new_invoices}
================================
"""
        logger.info(report)
        return report.strip()
        
    except Exception as e:
        error_msg = f"Error generating finance report: {e}"
        logger.error(error_msg)
        return f"Failed: {error_msg}"
