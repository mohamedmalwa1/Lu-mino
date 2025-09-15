# /home/lumino/app/myapp/core/api/urls.py
from django.urls import path
from .views import me, user_permissions, DashboardAnalyticsView

urlpatterns = [
    path("me/", me, name="me"),
    path("permissions/", user_permissions, name="user_permissions"),
    path('dashboard/analytics/', DashboardAnalyticsView.as_view(), name='dashboard-analytics'),
]
