from rest_framework import viewsets
from finance.models import (
    Invoice,
    Payment,
    Expense,
    PurchaseOrder,
    Treasury,
    TreasuryTransaction,
    SalaryPayment
)
from finance.api.serializers import (
    InvoiceSerializer,
    PaymentSerializer,
    ExpenseSerializer,
    PurchaseOrderSerializer,
    TreasurySerializer,
    TreasuryTransactionSerializer,
    SalaryPaymentSerializer
)

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related("student")
    serializer_class = InvoiceSerializer

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related("invoice__student", "treasury")
    serializer_class = PaymentSerializer

class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.select_related("treasury", "vendor")
    serializer_class = ExpenseSerializer

class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.select_related("vendor", "item")
    serializer_class = PurchaseOrderSerializer

class TreasuryViewSet(viewsets.ModelViewSet):
    queryset = Treasury.objects.all()
    serializer_class = TreasurySerializer

class TreasuryTransactionViewSet(viewsets.ModelViewSet):
    queryset = TreasuryTransaction.objects.all()
    serializer_class = TreasuryTransactionSerializer

# --- THIS VIEWSET IS NOW UPDATED ---
class SalaryPaymentViewSet(viewsets.ModelViewSet):
    # Use select_related to efficiently join the related tables
    queryset = SalaryPayment.objects.select_related("salary_record__staff", "treasury")
    serializer_class = SalaryPaymentSerializer

