from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.users.urls")),
    path("api/air-quality/", include("apps.air_quality.urls")),
    path("api/reports/", include("apps.reports.urls")),
    path("api/recommendations/", include("apps.recommendations.urls")),
]
