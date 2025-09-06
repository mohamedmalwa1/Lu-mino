# finance/api/views.py

from rest_framework import viewsets
from ..models import Treasury, Invoice, Payment, PurchaseOrder, Expense, SalaryPayment
from .serializers import (
    TreasurySerializer, InvoiceSerializer, PaymentSerializer,
    PurchaseOrderSerializer, ExpenseSerializer, SalaryPaymentSerializer
)

class TreasuryViewSet(viewsets.ModelViewSet):
    queryset = Treasury.objects.all()
    serializer_class = TreasurySerializer

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related('student').all()
    serializer_class = InvoiceSerializer
    filterset_fields = ['student', 'status']

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related('invoice', 'treasury').all()
    serializer_class = PaymentSerializer
    filterset_fields = ['invoice', 'treasury']

class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.select_related('vendor', 'item').all()
    serializer_class = PurchaseOrderSerializer
    filterset_fields = ['vendor', 'received']

class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.select_related('treasury', 'purchase_order').all()
    serializer_class = ExpenseSerializer
    filterset_fields = ['treasury', 'category', 'purchase_order']

class SalaryPaymentViewSet(viewsets.ModelViewSet):
    queryset = SalaryPayment.objects.select_related('payslip__payroll_profile__staff', 'treasury').all()
    serializer_class = SalaryPaymentSerializer
    filterset_fields = ['status', 'treasury']
