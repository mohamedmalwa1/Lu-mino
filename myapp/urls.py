# myapp/urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
# --- ADD THESE TWO IMPORTS ---
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Django admin
    path("admin/", admin.site.urls),

    # JWT auth endpoints
    path("api/token/",          TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/",  TokenRefreshView.as_view(),   name="token_refresh"),

    # V1 API Endpoints
    path("api/v1/student/",   include("student.api.urls")),
    path("api/v1/hr/",        include("hr.api.urls")),
    path("api/v1/inventory/", include("inventory.api.urls")),
    path("api/v1/finance/",   include("finance.api.urls")),
    path("api/v1/reporting/", include("reporting.api.urls")),
    path("api/v1/core/",      include("core.urls")),
]

# --- ADD THIS BLOCK AT THE END OF THE FILE ---
# This is crucial for serving user-uploaded files (media) in development mode.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
