# finance/admin.py

from django.contrib import admin
from .models import Treasury, Invoice, Payment, PurchaseOrder, Expense, SalaryPayment

@admin.register(Treasury)
class TreasuryAdmin(admin.ModelAdmin):
    list_display = ('name', 'balance')

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'student', 'amount', 'due_date', 'status')
    list_filter = ('status',)
    search_fields = ('invoice_number', 'student__first_name', 'student__last_name')

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('invoice', 'amount', 'date', 'treasury')
    autocomplete_fields = ('invoice',)

@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ('po_number', 'vendor', 'total', 'order_date', 'received')
    list_filter = ('received',)

@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('description', 'amount', 'date', 'category', 'treasury')
    list_filter = ('category',)

@admin.register(SalaryPayment)
class SalaryPaymentAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'amount', 'payment_date', 'status', 'treasury')
    list_filter = ('status',)
    autocomplete_fields = ('payslip',)
