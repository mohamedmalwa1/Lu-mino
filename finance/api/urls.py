# finance/api/urls.py
from django.urls import path
from rest_framework.routers import DefaultRouter

from finance.api.views import (
    InvoiceViewSet,
    PaymentViewSet,
    ExpenseViewSet,
    PurchaseOrderViewSet,
    TreasuryViewSet,
    TreasuryTransactionViewSet,
    SalaryPaymentViewSet,
)
from finance.views import (  # ← our custom endpoints live here
    InvoicePDFView, InvoiceEmailView,
    PaymentReceiptPDFView, PaymentReceiptEmailView,
)

router = DefaultRouter()
router.register("invoices", InvoiceViewSet)
router.register("payments", PaymentViewSet)
router.register("expenses", ExpenseViewSet)
router.register("purchase-orders", PurchaseOrderViewSet)
router.register("treasuries", TreasuryViewSet)
router.register("transactions", TreasuryTransactionViewSet)
router.register("salary-payments", SalaryPaymentViewSet)

urlpatterns = [
    # Invoice
    path("invoices/<int:pk>/pdf/",   InvoicePDFView.as_view(),    name="invoice_pdf"),
    path("invoices/<int:pk>/email/", InvoiceEmailView.as_view(),  name="invoice_email"),

    # Payment receipt
    path("payments/<int:pk>/receipt.pdf", PaymentReceiptPDFView.as_view(), name="payment_receipt_pdf"),
    path("payments/<int:pk>/email/",      PaymentReceiptEmailView.as_view(), name="payment_receipt_email"),
]

urlpatterns += router.urls

