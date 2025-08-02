from django.urls import path
from . import views

urlpatterns = [
    path("pnl/", views.pnl_report, name="pnl_report"),
    path("low-stock/", views.low_stock_report, name="low_stock_report"),
    path("balance-sheet/", views.balance_sheet, name="balance_sheet"),
    path("cash-flow/", views.cash_flow, name="cash_flow"),
    path("payroll-vs-att/", views.payroll_vs_att, name="payroll_vs_att"),
    path("expiring-docs/", views.expiring_docs, name="expiring_docs"),
]   

