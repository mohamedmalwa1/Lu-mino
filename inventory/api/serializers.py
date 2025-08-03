from rest_framework import serializers
from inventory.models import Item, Vendor, CustodyAssignment, StockTake
from student.models import Student
from hr.models import Staff


class VendorSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Vendor
        fields = "__all__"


class ItemSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    
    class Meta:
        model  = Item
        fields = "__all__"


# --- THIS SERIALIZER IS NOW UPDATED ---
class CustodyAssignmentSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    staff_name = serializers.CharField(source='staff.full_name', read_only=True, allow_null=True)
    student_name = serializers.CharField(source='student.name', read_only=True, allow_null=True)

    class Meta:
        model  = CustodyAssignment
        fields = "__all__"


class StockTakeSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    responsible_staff_name = serializers.CharField(source='responsible_staff.full_name', read_only=True)
    discrepancy = serializers.IntegerField(read_only=True)

    class Meta:
        model  = StockTake
        fields = "__all__"

