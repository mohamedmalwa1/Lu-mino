from rest_framework import serializers
from finance.models import (
    Invoice,
    Payment,
    Expense,
    PurchaseOrder,
    Treasury,
    TreasuryTransaction,
    SalaryPayment
)
from hr.models import SalaryRecord

class InvoiceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    class Meta:
        model = Invoice
        fields = "__all__"

class ExpenseSerializer(serializers.ModelSerializer):
    treasury_name = serializers.CharField(source='treasury.name', read_only=True, allow_null=True)
    vendor_name = serializers.CharField(source='vendor.name', read_only=True, allow_null=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    class Meta:
        model = Expense
        fields = "__all__"

class PaymentSerializer(serializers.ModelSerializer):
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    student_name = serializers.CharField(source='invoice.student.name', read_only=True)
    treasury_name = serializers.CharField(source='treasury.name', read_only=True)
    class Meta:
        model = Payment
        fields = "__all__"

class PurchaseOrderSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    item_name = serializers.CharField(source='item.name', read_only=True)
    class Meta:
        model = PurchaseOrder
        fields = "__all__"

class TreasurySerializer(serializers.ModelSerializer):
    class Meta:
        model = Treasury
        fields = "__all__"

class TreasuryTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TreasuryTransaction
        fields = "__all__"

# --- THIS SERIALIZER IS NOW UPDATED ---
class SalaryPaymentSerializer(serializers.ModelSerializer):
    # Add read-only fields for displaying related data
    staff_name = serializers.CharField(source='salary_record.staff.full_name', read_only=True)
    treasury_name = serializers.CharField(source='treasury.name', read_only=True)
    month = serializers.DateField(source='salary_record.month', read_only=True)

    class Meta:
        model = SalaryPayment
        fields = "__all__"

