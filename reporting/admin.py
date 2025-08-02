from django.contrib import admin
from .models import ReportJob

@admin.register(ReportJob)
class ReportJobAdmin(admin.ModelAdmin):
    list_display = ("report_type", "generated_at", "file")
    readonly_fields = ("generated_at",)

