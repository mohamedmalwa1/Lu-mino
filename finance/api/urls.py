from rest_framework.routers import DefaultRouter
from finance.api.views import (
    InvoiceViewSet,
    PaymentViewSet,
    ExpenseViewSet,
    PurchaseOrderViewSet,
    TreasuryViewSet,
    TreasuryTransactionViewSet,
    SalaryPaymentViewSet  # Added
)

router = DefaultRouter()

# Existing routes (unchanged)
router.register("invoices", InvoiceViewSet)
router.register("payments", PaymentViewSet)
router.register("expenses", ExpenseViewSet)
router.register("purchase-orders", PurchaseOrderViewSet)
router.register("treasuries", TreasuryViewSet)
router.register("transactions", TreasuryTransactionViewSet)

# New route
router.register("salary-payments", SalaryPaymentViewSet)

urlpatterns = router.urls
