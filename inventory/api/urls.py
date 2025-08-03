from rest_framework.routers import DefaultRouter
from .views import (
    ItemViewSet, VendorViewSet, CustodyViewSet, StockTakeViewSet
)

router = DefaultRouter()
router.register("items",      ItemViewSet,     basename="item")
router.register("vendors",    VendorViewSet,   basename="vendor")
# --- THIS LINE IS NOW CORRECTED ---
router.register("custody-assignments",    CustodyViewSet,  basename="custody-assignment")
router.register("stocktakes", StockTakeViewSet, basename="stocktake")

urlpatterns = router.urls

