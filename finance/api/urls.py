# finance/api/urls.py

from rest_framework.routers import DefaultRouter
from .views import (
    TreasuryViewSet, InvoiceViewSet, PaymentViewSet,
    PurchaseOrderViewSet, ExpenseViewSet, SalaryPaymentViewSet
)

router = DefaultRouter()
router.register(r'treasuries', TreasuryViewSet)
router.register(r'invoices', InvoiceViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'purchase-orders', PurchaseOrderViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'salary-payments', SalaryPaymentViewSet)

urlpatterns = router.urls
