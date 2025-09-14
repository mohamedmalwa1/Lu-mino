from django.http import HttpResponse, JsonResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

# Make sure all required tasks are imported
from .tasks import (
    generate_invoice_pdf, 
    email_invoice, 
    email_payment_receipt,
    generate_purchase_order_pdf,
    generate_payment_receipt_pdf
)

class InvoicePDFView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, pk):
        pdf_bytes = generate_invoice_pdf(pk)
        if pdf_bytes is None:
            return HttpResponse("Failed to generate PDF.", status=500)
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="invoice_{pk}.pdf"'
        return response

class InvoiceEmailView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, pk):
        email_invoice.delay(pk)
        return JsonResponse({"message": "Invoice emailing process has been started."})

# --- ADD THIS NEW VIEW ---
class PurchaseOrderPDFView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        pdf_bytes = generate_purchase_order_pdf(pk)
        if pdf_bytes is None:
            return HttpResponse("Failed to generate PO PDF.", status=500)
            
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="po_{pk}.pdf"'
        return response

class PaymentReceiptPDFView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, pk):
        pdf_bytes = generate_payment_receipt_pdf(pk)
        if pdf_bytes is None:
            return HttpResponse("Failed to generate Receipt PDF.", status=500)
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="receipt_{pk}.pdf"'
        return response

class PaymentReceiptEmailView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, pk):
        email_payment_receipt.delay(pk)
        return JsonResponse({"message": "Payment receipt emailing has been started."})
