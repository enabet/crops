from rest_framework import serializers
from .models import Farm

class FarmSerializer(serializers.ModelSerializer):
    class Meta:
        model = Farm
        fields = [
            "id", "name", "location_name", "country", "district",
            "area_hectares", "soil_type", "water_source",
            "latitude", "longitude", "notes", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
