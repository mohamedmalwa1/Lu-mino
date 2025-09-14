# core/urls.py
from django.urls import path
from .views import DashboardAnalyticsView


urlpatterns = [
    # This single endpoint will now provide all dashboard data
    path('dashboard/analytics/', DashboardAnalyticsView.as_view(), name='dashboard-analytics'),
]
