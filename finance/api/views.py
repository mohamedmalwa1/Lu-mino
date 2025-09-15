from rest_framework.decorators import api_view
from rest_framework.permissions import IsAuthenticated
from core.api.permissions import ModulePermission
from rest_framework.response import Response
from rest_framework import viewsets
from datetime import datetime
from rest_framework.decorators import api_view, permission_classes
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
    permission_classes = [IsAuthenticated, ModulePermission]
    module_name = 'finance'

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related("invoice__student", "treasury")
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, ModulePermission]
    module_name = 'finance'

class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.select_related("treasury", "vendor")
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated, ModulePermission]
    module_name = 'finance'

class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.select_related("vendor", "item")
    serializer_class = PurchaseOrderSerializer
    permission_classes = [IsAuthenticated, ModulePermission]
    module_name = 'finance'

class TreasuryViewSet(viewsets.ModelViewSet):
    queryset = Treasury.objects.all()
    serializer_class = TreasurySerializer
    permission_classes = [IsAuthenticated, ModulePermission]
    module_name = 'finance'

class TreasuryTransactionViewSet(viewsets.ModelViewSet):
    queryset = TreasuryTransaction.objects.all()
    serializer_class = TreasuryTransactionSerializer
    permission_classes = [IsAuthenticated, ModulePermission]
    module_name = 'finance'

class SalaryPaymentViewSet(viewsets.ModelViewSet):
    queryset = SalaryPayment.objects.select_related("salary_record__staff", "treasury")
    serializer_class = SalaryPaymentSerializer
    permission_classes = [IsAuthenticated, ModulePermission]
    module_name = 'finance'

# API endpoint function
@api_view(['POST'])
# This view is now also protected by our new permission system
@permission_classes([IsAuthenticated, ModulePermission])
def check_existing_salary_payment(request):
    # Manually set the module_name for our permission class to check
    request.view.module_name = 'finance'

    staff_id = request.data.get('staff_id')
    month = request.data.get('month')
    year = request.data.get('year')

    if not all([staff_id, month, year]):
        return Response({'error': 'staff_id, month, and year are required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Check if a SalaryPayment exists for the given month and year
        existing_payment = SalaryPayment.objects.filter(
            staff_id=staff_id,
            month=month,
            year=year
        ).exists()

        # Additionally check if a SalaryRecord exists
        existing_record = SalaryRecord.objects.filter(
            staff_id=staff_id,
            month=month,
            year=year
        ).exists()

        return Response({'exists': existing_payment or existing_record})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
