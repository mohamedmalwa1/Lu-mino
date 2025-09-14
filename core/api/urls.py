# app/core/api/urls.py
from django.urls import path
from .views import get_user_module_permissions

urlpatterns = [
    path('user-permissions/', get_user_module_permissions, name='user-permissions'),
]
