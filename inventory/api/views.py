from rest_framework import viewsets, permissions
from inventory.models import Item, Vendor, CustodyAssignment, StockTake
from .serializers import (
    ItemSerializer, VendorSerializer,
    CustodyAssignmentSerializer, StockTakeSerializer,
)


class DefaultPermissionMixin:
    """Logged-in users only; superuser can do anything."""
    permission_classes = [permissions.IsAuthenticated]


class VendorViewSet(DefaultPermissionMixin, viewsets.ModelViewSet):
    queryset         = Vendor.objects.all()
    serializer_class = VendorSerializer


class ItemViewSet(DefaultPermissionMixin, viewsets.ModelViewSet):
    queryset         = Item.objects.select_related("vendor")
    serializer_class = ItemSerializer
    filterset_fields = ["category", "vendor"]      # optional nicety
    search_fields    = ["name", "sku"]


class CustodyViewSet(DefaultPermissionMixin, viewsets.ModelViewSet):
    queryset         = CustodyAssignment.objects.select_related(
        "item", "staff", "student"
    )
    serializer_class = CustodyAssignmentSerializer
    filterset_fields = ["staff", "student"]


class StockTakeViewSet(DefaultPermissionMixin, viewsets.ModelViewSet):
    queryset         = StockTake.objects.select_related("item", "responsible_staff")
    serializer_class = StockTakeSerializer
    filterset_fields = ["date", "item"]
