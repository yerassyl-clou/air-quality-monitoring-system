from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Recommendation
from .serializers import RecommendationSerializer
from .services import BASE_MESSAGES, build_personalized_recommendation


class RecommendationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        aqi = int(request.query_params.get("aqi", "0"))
        queryset = Recommendation.objects.all()
        recommendations = RecommendationSerializer(queryset, many=True).data
        if not recommendations:
            recommendations = BASE_MESSAGES
        personalized = build_personalized_recommendation(aqi, request.user.profile.sensitivity_level)
        return Response({"rules": recommendations, "personalized": personalized})
