# app/core/api/urls.py
from django.urls import path
from .views import user_permissions, me

urlpatterns = [
    path("user-permissions/", user_permissions, name="user-permissions"),
    path("users/me/",         me,              name="users-me"),
]

