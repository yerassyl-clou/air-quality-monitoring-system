from django.urls import path

from .views import LoginView, MeView, NotificationListView, RefreshTokenView, RegisterView, UserProfileView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("refresh/", RefreshTokenView.as_view(), name="token-refresh"),
    path("me/", MeView.as_view(), name="me"),
    path("profile/", UserProfileView.as_view(), name="profile"),
    path("notifications/", NotificationListView.as_view(), name="notifications"),
]
