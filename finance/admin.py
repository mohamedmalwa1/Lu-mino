# finance/admin.py
from django.contrib import admin
from .models import (
    Treasury,
    TreasuryTransaction,
    Invoice,
    Payment,
    Expense,
    SalaryPayment,
    PurchaseOrder,
)

# ───────── Treasury ─────────
@admin.register(Treasury)
class TreasuryAdmin(admin.ModelAdmin):
    list_display  = ("id", "name", "balance")
    search_fields = ("name",)


@admin.register(TreasuryTransaction)
class TreasuryTransactionAdmin(admin.ModelAdmin):
    list_display        = ("id", "treasury", "date", "amount", "is_inflow", "reference")
    list_filter         = ("treasury", "is_inflow", "date")
    search_fields       = ("reference", "description")
    autocomplete_fields = ("treasury",)


# ───────── Invoices & Payments ─────────
@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display        = ("invoice_number", "student", "amount", "status", "due_date")
    list_filter         = ("status",)
    search_fields       = ("invoice_number", "student__first_name", "student__last_name")
    autocomplete_fields = ("student",)


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display        = ("invoice", "amount", "treasury", "date")
    autocomplete_fields = ("invoice", "treasury")
    search_fields       = ("invoice__invoice_number",)


# ───────── Expenses ─────────
@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display        = ("id", "vendor", "amount", "treasury", "date")
    autocomplete_fields = ("vendor", "treasury")
    search_fields       = ("vendor__name", "reference")


# ───────── Salary Payments ─────────
@admin.register(SalaryPayment)
class SalaryPaymentAdmin(admin.ModelAdmin):
    list_display        = ("salary_record", "amount", "treasury", "date")
    autocomplete_fields = ("salary_record", "treasury")
    search_fields       = (
        "salary_record__staff__first_name",
        "salary_record__staff__last_name",
    )


# ───────── Purchase Orders ─────────
@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display        = (
        "po_number",
        "vendor",
        "item",
        "quantity",
        "unit_price",
        "order_date",
        "received",
    )
    autocomplete_fields = ("vendor", "item")
    search_fields       = ("po_number", "vendor__name", "item__name")
    list_filter         = ("received",)

