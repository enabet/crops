from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Farm
from .serializers import FarmSerializer

class FarmViewSet(viewsets.ModelViewSet):
    serializer_class = FarmSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.role in {"super_admin", "country_admin"}:
            qs = Farm.objects.all()
            if user.role == "country_admin" and user.country:
                qs = qs.filter(country=user.country)
            return qs.order_by("-created_at")
        return Farm.objects.filter(owner=user).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
