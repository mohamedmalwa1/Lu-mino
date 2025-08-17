# myapp/urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # Django admin
    path("admin/", admin.site.urls),

    # JWT auth endpoints
    path("api/token/",          TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/",  TokenRefreshView.as_view(),   name="token_refresh"),

    # domain APIs (add one line per app)
    path("api/v1/student/",   include("student.api.urls")),
    path("api/v1/hr/",        include("hr.api.urls")),
    path("api/v1/inventory/", include("inventory.api.urls")),
    path("api/v1/finance/",   include("finance.api.urls")),
    
    # Add this line to include your reporting API
    path("api/reporting/", include("reporting.api.urls")),
]
