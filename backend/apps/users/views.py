from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import Notification, UserProfile
from .serializers import NotificationSerializer, RegisterSerializer, UserProfileSerializer, UserSerializer


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class LoginView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]


class RefreshTokenView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]


class UserProfileView(APIView):
    def get(self, request):
        profile, _ = UserProfile.objects.get_or_create(
            user=request.user,
            defaults={
                "age_group": "adult",
                "occupation": "Not specified",
                "sensitivity_level": "normal",
                "location": "Almaty",
            },
        )
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)
