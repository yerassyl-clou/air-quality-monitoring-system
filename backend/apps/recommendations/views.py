from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .llm_service import generate_ai_recommendation
from .models import Recommendation
from .serializers import AIRecommendationRequestSerializer, RecommendationSerializer
from .services import BASE_MESSAGES, build_personalized_recommendation, fallback_risk_for_aqi, predict_risk


class RecommendationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        aqi = int(request.query_params.get("aqi", "0"))
        pm25 = request.query_params.get("pm25")
        pm10 = request.query_params.get("pm10")
        queryset = Recommendation.objects.all()
        recommendations = RecommendationSerializer(queryset, many=True).data
        if not recommendations:
            recommendations = BASE_MESSAGES
        personalized = build_personalized_recommendation(
            aqi=aqi,
            pm25=float(pm25) if pm25 not in (None, "") else None,
            pm10=float(pm10) if pm10 not in (None, "") else None,
            age_group=request.user.profile.age_group,
            sensitivity_level=request.user.profile.sensitivity_level,
        )
        return Response({"rules": recommendations, "personalized": personalized})


class AIRecommendationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AIRecommendationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data

        aqi = float(validated["aqi"])
        pm25 = float(validated["pm25"])
        pm10 = float(validated["pm10"])
        lang = validated.get("lang", "en")
        profile = request.user.profile

        try:
            risk = (
                predict_risk(
                    aqi=aqi,
                    pm25=pm25,
                    pm10=pm10,
                    age_group=profile.age_group,
                    sensitivity=profile.sensitivity_level,
                )
                if predict_risk
                else fallback_risk_for_aqi(int(aqi), pm25, profile.sensitivity_level)
            )
        except Exception:
            risk = fallback_risk_for_aqi(int(aqi), pm25, profile.sensitivity_level)

        ai_text = generate_ai_recommendation(
            user=request.user,
            air={"aqi": aqi, "pm25": pm25, "pm10": pm10},
            risk=int(risk),
            lang=lang,
        )
        return Response({"risk": int(risk), "ai_text": ai_text})
