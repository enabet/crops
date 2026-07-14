from django.conf import settings
from django.contrib.gis.db import models
from django.db import migrations
import django.db.models.deletion

class Migration(migrations.Migration):
    initial = True
    dependencies = [migrations.swappable_dependency(settings.AUTH_USER_MODEL)]
    operations = [
        migrations.CreateModel(
            name="Farm",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=150)),
                ("location_name", models.CharField(blank=True, max_length=200)),
                ("country", models.CharField(default="Belize", max_length=100)),
                ("district", models.CharField(blank=True, max_length=100)),
                ("area_hectares", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ("soil_type", models.CharField(blank=True, max_length=100)),
                ("water_source", models.CharField(blank=True, max_length=100)),
                ("latitude", models.DecimalField(blank=True, decimal_places=7, max_digits=10, null=True)),
                ("longitude", models.DecimalField(blank=True, decimal_places=7, max_digits=10, null=True)),
                ("location", models.PointField(blank=True, null=True, srid=4326)),
                ("notes", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("owner", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="farms", to=settings.AUTH_USER_MODEL)),
            ],
        )
    ]
