# inventory/admin.py
from django.contrib import admin
from .models import Vendor, Item, CustodyAssignment, StockTake


# ───────── VENDOR ─────────
@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display  = ("id", "name", "phone", "contact_email")
    search_fields = ("name", "phone", "contact_email")


# ───────── ITEM ─────────
@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display        = ("id", "name", "sku", "category",
                           "unit_price", "quantity",
                           "min_required", "reorder_level")
    list_filter         = ("category",)
    autocomplete_fields = ("vendor",)
    search_fields       = ("name", "sku")


# ───────── CUSTODY ASSIGNMENT ─────────
@admin.register(CustodyAssignment)
class CustodyAssignmentAdmin(admin.ModelAdmin):
    list_display        = ("item", "quantity", "staff", "student", "assigned_on", "return_date")
    autocomplete_fields = ("item", "staff", "student")
    search_fields       = (
        "item__name",
        "staff__first_name", "staff__last_name",
        "student__first_name", "student__last_name",
    )


# ───────── STOCK TAKE ─────────
@admin.register(StockTake)
class StockTakeAdmin(admin.ModelAdmin):
    list_display        = ("item", "date", "counted_quantity", "responsible_staff")
    autocomplete_fields = ("item", "responsible_staff")
    search_fields       = (
        "item__name",
        "responsible_staff__first_name", "responsible_staff__last_name",
    )

