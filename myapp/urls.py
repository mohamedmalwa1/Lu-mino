# myapp/urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),

    # JWT
    path("api/token/",         TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(),    name="token_refresh"),

    # API v1
    path("api/v1/student/",   include("student.api.urls")),
    path("api/v1/hr/",        include("hr.api.urls")),
    path("api/v1/inventory/", include("inventory.api.urls")),
    path("api/v1/finance/",   include("finance.api.urls")),
    path("api/v1/reporting/", include("reporting.api.urls")),
    path("api/v1/core/",      include("core.api.urls")),   # <— our new endpoints
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

