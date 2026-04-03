from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import Notification, User, UserProfile


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ("id",)
    list_display = ("id", "email", "role", "is_staff", "created_at")
    search_fields = ("email",)
    readonly_fields = ("created_at",)
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Permissions", {"fields": ("role", "is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Dates", {"fields": ("created_at",)}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "password1", "password2", "role", "is_staff", "is_superuser"),
            },
        ),
    )


admin.site.register(UserProfile)
admin.site.register(Notification)
