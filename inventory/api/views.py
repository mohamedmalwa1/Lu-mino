from rest_framework import viewsets, permissions
from rest_framework.permissions import IsAuthenticated, DjangoModelPermissions 
from inventory.models import Item, Vendor, CustodyAssignment, StockTake
from .serializers import (
    ItemSerializer, VendorSerializer,
    CustodyAssignmentSerializer, StockTakeSerializer,
)


class DefaultPermissionMixin:
    """Logged-in users only."""
    permission_classes = [permissions.IsAuthenticated]


class VendorViewSet(DefaultPermissionMixin, viewsets.ModelViewSet):
    queryset         = Vendor.objects.all()
    serializer_class = VendorSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]


class ItemViewSet(DefaultPermissionMixin, viewsets.ModelViewSet):
    queryset         = Item.objects.select_related("vendor")
    serializer_class = ItemSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filterset_fields = ["category", "vendor"]
    search_fields    = ["name", "sku"]


class CustodyViewSet(DefaultPermissionMixin, viewsets.ModelViewSet):
    queryset         = CustodyAssignment.objects.select_related(
        "item", "staff", "student"
    )
    serializer_class = CustodyAssignmentSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filterset_fields = ["staff", "student"]


class StockTakeViewSet(DefaultPermissionMixin, viewsets.ModelViewSet):
    queryset         = StockTake.objects.select_related("item", "responsible_staff")
    serializer_class = StockTakeSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filterset_fields = ["date", "item"]

