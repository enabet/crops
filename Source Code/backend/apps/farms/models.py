from django.conf import settings
from django.contrib.gis.db import models

class Farm(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="farms")
    name = models.CharField(max_length=150)
    location_name = models.CharField(max_length=200, blank=True)
    country = models.CharField(max_length=100, default="Belize")
    district = models.CharField(max_length=100, blank=True)
    area_hectares = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    soil_type = models.CharField(max_length=100, blank=True)
    water_source = models.CharField(max_length=100, blank=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    location = models.PointField(srid=4326, null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if self.latitude is not None and self.longitude is not None:
            from django.contrib.gis.geos import Point
            self.location = Point(float(self.longitude), float(self.latitude), srid=4326)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name
