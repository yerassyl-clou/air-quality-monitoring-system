from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import UserProfile

User = get_user_model()


@receiver(post_save, sender=User)
def ensure_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.get_or_create(
            user=instance,
            defaults={
                "age_group": UserProfile.AgeGroup.ADULT,
                "occupation": "Not specified",
                "sensitivity_level": UserProfile.SensitivityLevel.NORMAL,
                "location": "Almaty",
            },
        )
