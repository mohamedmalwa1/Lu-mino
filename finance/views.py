# finance/views.py

from django.http import HttpResponse, JsonResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

# Import the PDF generation task directly from your working tasks file
from .tasks import generate_invoice_pdf, email_invoice, email_payment_receipt

class InvoicePDFView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        # Call the task function directly to run it immediately
        pdf_bytes = generate_invoice_pdf(pk)
        
        if pdf_bytes is None:
            return HttpResponse("Failed to generate PDF. Check server logs for errors.", status=500)
            
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="invoice_{pk}.pdf"'
        return response

class InvoiceEmailView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        # Send the task to the Celery worker to run in the background
        email_invoice.delay(pk)
        return JsonResponse({"message": "Invoice emailing process has been started."})

class PaymentReceiptPDFView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        return HttpResponse("Payment receipt PDF generation not yet implemented.", status=501)

class PaymentReceiptEmailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        email_payment_receipt.delay(pk)
        return JsonResponse({"message": "Payment receipt emailing has been started."})
