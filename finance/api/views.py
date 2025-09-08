from rest_framework.decorators import api_view
from rest_framework.response import Response
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

# API ViewSets
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

class SalaryPaymentViewSet(viewsets.ModelViewSet):
    queryset = SalaryPayment.objects.select_related("salary_record__staff", "treasury")
    serializer_class = SalaryPaymentSerializer

# API endpoint function
@api_view(['GET'])
def check_existing_salary_payment(request):
    """Check if a salary payment already exists for the given parameters"""
    salary_record_id = request.GET.get('salary_record')
    treasury_id = request.GET.get('treasury')
    date = request.GET.get('date')
    
    exists = SalaryPayment.objects.filter(
        salary_record_id=salary_record_id,
        treasury_id=treasury_id,
        date=date
    ).exists()
    
    return Response({'exists': exists})
