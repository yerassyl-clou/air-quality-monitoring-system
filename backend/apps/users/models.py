from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models

from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    class Roles(models.TextChoices):
        ADMIN = "admin", "Admin"
        CITIZEN = "citizen", "Citizen"
        ANALYST = "analyst", "Analyst"

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Roles.choices, default=Roles.CITIZEN)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self) -> str:
        return self.email


class UserProfile(models.Model):
    class AgeGroup(models.TextChoices):
        CHILD = "child", "Child"
        ADULT = "adult", "Adult"
        SENIOR = "senior", "Senior"

    class SensitivityLevel(models.TextChoices):
        NORMAL = "normal", "Normal"
        ASTHMA = "asthma", "Asthma"
        ATHLETE = "athlete", "Athlete"

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    age_group = models.CharField(max_length=20, choices=AgeGroup.choices)
    occupation = models.CharField(max_length=120)
    sensitivity_level = models.CharField(max_length=20, choices=SensitivityLevel.choices, default=SensitivityLevel.NORMAL)
    location = models.CharField(max_length=120)

    def __str__(self) -> str:
        return f"{self.user.email} profile"


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Notification<{self.user.email}>"
