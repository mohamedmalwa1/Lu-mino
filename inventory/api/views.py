# app/inventory/api/views.py
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from core.api.permissions import ModulePermission
from inventory.models import Item, Vendor, CustodyAssignment, StockTake
from .serializers import (
    ItemSerializer, VendorSerializer,
    CustodyAssignmentSerializer, StockTakeSerializer,
)

class VendorViewSet(viewsets.ModelViewSet):
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer
    permission_classes = [IsAuthenticated, ModulePermission]
    module_name = "inventory"

class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.select_related("vendor")
    serializer_class = ItemSerializer
    permission_classes = [IsAuthenticated, ModulePermission]
    module_name = "inventory"
    filterset_fields = ["category", "vendor"]
    search_fields = ["name", "sku"]

class CustodyViewSet(viewsets.ModelViewSet):
    queryset = CustodyAssignment.objects.select_related("item", "staff", "student")
    serializer_class = CustodyAssignmentSerializer
    permission_classes = [IsAuthenticated, ModulePermission]
    module_name = "inventory"
    filterset_fields = ["staff", "student"]

class StockTakeViewSet(viewsets.ModelViewSet):
    queryset = StockTake.objects.select_related("item", "responsible_staff")
    serializer_class = StockTakeSerializer
    permission_classes = [IsAuthenticated, ModulePermission]
    module_name = "inventory"
    filterset_fields = ["date", "item"]

