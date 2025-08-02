from rest_framework import serializers
from inventory.models import Item, Vendor, CustodyAssignment, StockTake


class VendorSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Vendor
        fields = "__all__"


class ItemSerializer(serializers.ModelSerializer):
    vendor = VendorSerializer(read_only=True)           # nested read
    vendor_id = serializers.PrimaryKeyRelatedField(     # writable FK
        queryset=Vendor.objects.all(), source="vendor", write_only=True
    )

    class Meta:
        model  = Item
        fields = "__all__"


class CustodyAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model  = CustodyAssignment
        fields = "__all__"


class StockTakeSerializer(serializers.ModelSerializer):
    discrepancy = serializers.IntegerField(read_only=True)

    class Meta:
        model  = StockTake
        fields = "__all__"


