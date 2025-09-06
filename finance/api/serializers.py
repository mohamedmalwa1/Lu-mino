# finance/api/serializers.py

from rest_framework import serializers
from ..models import Treasury, Invoice, Payment, PurchaseOrder, Expense, SalaryPayment

class TreasurySerializer(serializers.ModelSerializer):
    class Meta:
        model = Treasury
        fields = '__all__'

class InvoiceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    class Meta:
        model = Invoice
        fields = '__all__'

class PaymentSerializer(serializers.ModelSerializer):
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    treasury_name = serializers.CharField(source='treasury.name', read_only=True)
    class Meta:
        model = Payment
        fields = '__all__'

class PurchaseOrderSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    item_name = serializers.CharField(source='item.name', read_only=True)
    total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    class Meta:
        model = PurchaseOrder
        fields = '__all__'

class ExpenseSerializer(serializers.ModelSerializer):
    treasury_name = serializers.CharField(source='treasury.name', read_only=True)
    po_number = serializers.CharField(source='purchase_order.po_number', read_only=True, allow_null=True)
    class Meta:
        model = Expense
        fields = '__all__'

class SalaryPaymentSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='payslip.payroll_profile.staff.full_name', read_only=True)
    month = serializers.DateField(source='payslip.month', read_only=True)
    treasury_name = serializers.CharField(source='treasury.name', read_only=True, allow_null=True)
    class Meta:
        model = SalaryPayment
        fields = '__all__'
