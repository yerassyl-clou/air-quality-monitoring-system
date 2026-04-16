from django.urls import path

from .views import AIRecommendationView, RecommendationListView

urlpatterns = [
    path("", RecommendationListView.as_view(), name="recommendation-list"),
    path("ai/", AIRecommendationView.as_view(), name="recommendation-ai"),
]
