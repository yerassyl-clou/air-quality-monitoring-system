from rest_framework import mixins, permissions, viewsets

from .models import Report
from .serializers import ReportSerializer


class ReportViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Report.objects.select_related("user", "location").filter(user=self.request.user)
