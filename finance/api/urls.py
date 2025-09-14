from rest_framework.routers import DefaultRouter
from django.urls import path, include
from finance.api.views import (
    InvoiceViewSet,
    PaymentViewSet,
    ExpenseViewSet,
    PurchaseOrderViewSet,
    TreasuryViewSet,
    TreasuryTransactionViewSet,
    SalaryPaymentViewSet,
    check_existing_salary_payment
)

# Import PDF views from the main finance views.py
from finance.views import (
    PurchaseOrderPDFView,
    InvoicePDFView,
    InvoiceEmailView,
    PaymentReceiptEmailView
)

router = DefaultRouter()

router.register("invoices", InvoiceViewSet)
router.register("payments", PaymentViewSet)
router.register("expenses", ExpenseViewSet)
router.register("purchase-orders", PurchaseOrderViewSet)
router.register("treasuries", TreasuryViewSet)
router.register("treasury-transactions", TreasuryTransactionViewSet)
router.register("salary-payments", SalaryPaymentViewSet)

urlpatterns = [
    path("", include(router.urls)),
    
    # PDF and Email endpoints
    path("purchase-orders/<int:pk>/pdf/", PurchaseOrderPDFView.as_view(), name="po_pdf"),
    path("invoices/<int:pk>/pdf/",   InvoicePDFView.as_view(),    name="invoice_pdf"),
    path("invoices/<int:pk>/email/", InvoiceEmailView.as_view(),  name="invoice_email"),
    path("payments/<int:pk>/email/", PaymentReceiptEmailView.as_view(), name="payment_receipt_email"),
    
    # API endpoint
    path("check-existing-salary-payment/", check_existing_salary_payment, name="check-existing-salary-payment"),
]
