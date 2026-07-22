"""
CARDI Platform - Standalone Core Module Tests.

These tests intentionally avoid database access and Django model setup. They are
plain unittest tests, so they can run through either:

    python manage.py test tests.test_core_modules

or:

    python -m unittest tests.test_core_modules

Coverage:
  - GIS coordinate and distance validation
  - Gamification point rules and level calculation
  - Badge condition checks
  - Farmer profile and crop record input validation
"""

from __future__ import annotations

import math
from decimal import Decimal, InvalidOperation
from unittest import TestCase


# ---------------------------------------------------------------------------
# Standalone helpers mirroring stable CARDI business rules
# ---------------------------------------------------------------------------


VALID_CROP_STATUSES = {
    "planned",
    "planted",
    "growing",
    "ready_to_harvest",
    "harvested",
    "failed",
}

POINTS_TABLE = {
    "daily_login": 5,
    "profile_complete": 25,
    "farm_create": 30,
    "crop_record_create": 30,
    "harvest_create": 50,
    "crop_plan_generate": 50,
    "plan_task_complete": 10,
    "forum_thread_create": 15,
    "forum_reply_create": 10,
    "forum_vote": 2,
    "upvote_received": 5,
    "official_answer": 20,
    "chat_message": 5,
}

LEVEL_SIZE = 100


def validate_coordinates(lat: float, lon: float) -> bool:
    """Validate latitude and longitude are within global coordinate ranges."""
    if not -90 <= lat <= 90:
        raise ValueError(f"Invalid latitude: {lat}. Must be between -90 and 90.")
    if not -180 <= lon <= 180:
        raise ValueError(f"Invalid longitude: {lon}. Must be between -180 and 180.")
    return True


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance in kilometers between two coordinates."""
    radius_km = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    )
    return 2 * radius_km * math.asin(math.sqrt(a))


def calculate_points(actions: list[str]) -> int:
    """Calculate total points for a sequence of gamified CARDI actions."""
    return sum(POINTS_TABLE.get(action, 0) for action in actions)


def calculate_level(total_points: int) -> dict[str, int]:
    """Mirror CARDI numeric level progression: each 100 points adds a level."""
    level = max(1, int(total_points // LEVEL_SIZE) + 1)
    current_floor = (level - 1) * LEVEL_SIZE
    next_floor = level * LEVEL_SIZE
    progress = max(0, min(100, int(((total_points - current_floor) / LEVEL_SIZE) * 100)))
    return {
        "level": level,
        "current_floor": current_floor,
        "next_level_points": next_floor,
        "points_to_next_level": max(0, next_floor - total_points),
        "progress_percent": progress,
    }


def check_badge_condition(badge_name: str, metrics: dict[str, int]) -> bool:
    """Evaluate whether a badge is earned from simple aggregate metrics."""
    conditions = {
        "First Login": metrics.get("daily_logins", 0) >= 1,
        "Profile Complete": metrics.get("profiles_completed", 0) >= 1,
        "First Farm": metrics.get("farms", 0) >= 1,
        "Crop Starter": metrics.get("crop_records", 0) >= 1,
        "Harvest Logger": metrics.get("harvests", 0) >= 1,
        "Plan Builder": metrics.get("crop_plans", 0) >= 1,
        "Forum Helper": metrics.get("forum_replies", 0) >= 1,
        "Community Voice": metrics.get("forum_threads", 0) >= 1,
        "Chat Connector": metrics.get("chat_messages", 0) >= 1,
    }
    return conditions.get(badge_name, False)


def decimal_from_payload(value: object, field_name: str, errors: list[str]) -> Decimal | None:
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        errors.append(f"{field_name} must be a valid decimal")
        return None


def validate_crop_record(data: dict[str, object]) -> list[str]:
    """Validate the API-facing crop record payload without touching the DB."""
    errors: list[str] = []
    if not data.get("crop"):
        errors.append("crop is required")
    if not data.get("farm"):
        errors.append("farm is required")
    if not data.get("planting_date"):
        errors.append("planting_date is required")

    land_area = decimal_from_payload(data.get("land_area_used", 0), "land_area_used", errors)
    if land_area is not None and land_area <= 0:
        errors.append("land_area_used must be greater than 0")

    quantity = decimal_from_payload(data.get("quantity_planted", 0), "quantity_planted", errors)
    if quantity is not None and quantity <= 0:
        errors.append("quantity_planted must be greater than 0")

    status = data.get("status")
    if status not in VALID_CROP_STATUSES:
        errors.append(f"status must be one of: {', '.join(sorted(VALID_CROP_STATUSES))}")

    return errors


def validate_farmer_profile(data: dict[str, object]) -> list[str]:
    """Validate the minimum farmer profile fields used by onboarding."""
    errors: list[str] = []
    for field in ["country_code", "district", "farm_name", "primary_soil_type", "farming_type"]:
        if not str(data.get(field, "")).strip():
            errors.append(f"{field} is required")

    total_land = decimal_from_payload(data.get("total_land_hectares", 0), "total_land_hectares", errors)
    if total_land is not None and total_land <= 0:
        errors.append("total_land_hectares must be greater than 0")

    years = data.get("years_experience", 0)
    if not isinstance(years, int) or years < 0:
        errors.append("years_experience must be a non-negative integer")

    return errors


# ═══════════════════════════════════════════════════════════════
# SECTION 1 — GIS / PostGIS SPATIAL TESTS (White-box)
# ═══════════════════════════════════════════════════════════════


class GISSpatialCoreTests(TestCase):
    def test_valid_belize_coordinates_are_accepted(self):
        self.assertTrue(validate_coordinates(17.2514, -88.7590))

    def test_valid_jamaica_coordinates_are_accepted(self):
        self.assertTrue(validate_coordinates(17.9971, -76.7936))

    def test_latitude_above_90_raises_error(self):
        with self.assertRaisesRegex(ValueError, "Invalid latitude"):
            validate_coordinates(95.0, -88.0)

    def test_latitude_below_minus_90_raises_error(self):
        with self.assertRaisesRegex(ValueError, "Invalid latitude"):
            validate_coordinates(-91.0, -88.0)

    def test_longitude_above_180_raises_error(self):
        with self.assertRaisesRegex(ValueError, "Invalid longitude"):
            validate_coordinates(17.0, 200.0)

    def test_haversine_distance_belize_to_jamaica(self):
        distance = haversine_distance_km(17.2514, -88.7590, 17.9971, -76.7936)
        self.assertGreater(distance, 1000)
        self.assertLess(distance, 1300)

    def test_haversine_same_point_is_zero(self):
        distance = haversine_distance_km(17.2514, -88.7590, 17.2514, -88.7590)
        self.assertLess(abs(distance), 0.001)

    def test_farm_area_one_hectare_calculation(self):
        width_m, height_m = 100, 100
        area_ha = (width_m * height_m) / 10000
        self.assertLess(abs(area_ha - 1.0), 0.001)


# ---------------------------------------------------------------------------
# Gamification tests
# ---------------------------------------------------------------------------


class GamificationCoreTests(TestCase):
    def test_zero_points_starts_at_level_one(self):
        level = calculate_level(0)
        self.assertEqual(level["level"], 1)
        self.assertEqual(level["points_to_next_level"], 100)

    def test_99_points_still_level_one_boundary(self):
        level = calculate_level(99)
        self.assertEqual(level["level"], 1)
        self.assertEqual(level["progress_percent"], 99)

    def test_100_points_reaches_level_two(self):
        level = calculate_level(100)
        self.assertEqual(level["level"], 2)
        self.assertEqual(level["current_floor"], 100)
        self.assertEqual(level["next_level_points"], 200)

    def test_500_points_reaches_level_six(self):
        self.assertEqual(calculate_level(500)["level"], 6)

    def test_new_farmer_onboarding_points(self):
        actions = ["daily_login", "profile_complete", "farm_create", "crop_record_create"]
        total = calculate_points(actions)
        self.assertEqual(total, 90)
        self.assertEqual(calculate_level(total)["level"], 1)

    def test_active_farmer_crosses_multiple_levels(self):
        actions = (
            ["daily_login", "profile_complete", "farm_create"]
            + ["crop_record_create"] * 3
            + ["harvest_create"] * 2
            + ["forum_thread_create"] * 2
            + ["crop_plan_generate"]
        )
        total = calculate_points(actions)
        self.assertEqual(total, 330)
        self.assertEqual(calculate_level(total)["level"], 4)

    def test_unknown_action_awards_zero_points(self):
        self.assertEqual(calculate_points(["daily_login", "unknown_action"]), 5)

    def test_first_harvest_badge_condition(self):
        self.assertTrue(check_badge_condition("Harvest Logger", {"harvests": 1}))

    def test_harvest_badge_not_earned_without_harvests(self):
        self.assertFalse(check_badge_condition("Harvest Logger", {"harvests": 0}))

    def test_forum_helper_badge_condition(self):
        self.assertTrue(check_badge_condition("Forum Helper", {"forum_replies": 1}))

    def test_unknown_badge_is_not_earned(self):
        self.assertFalse(check_badge_condition("Unknown Badge", {"harvests": 100}))


# ---------------------------------------------------------------------------
# Farmer and crop validation tests
# ---------------------------------------------------------------------------


class FarmerProfileValidationCoreTests(TestCase):
    def test_valid_farmer_profile_passes_validation(self):
        data = {
            "country_code": "BZ",
            "district": "Cayo",
            "farm_name": "Reyes Farm",
            "total_land_hectares": "2.50",
            "primary_soil_type": "loam",
            "farming_type": "mixed",
            "years_experience": 5,
        }
        self.assertEqual(validate_farmer_profile(data), [])

    def test_missing_country_and_district_are_rejected(self):
        errors = validate_farmer_profile(
            {
                "farm_name": "Reyes Farm",
                "total_land_hectares": "2.50",
                "primary_soil_type": "loam",
                "farming_type": "mixed",
                "years_experience": 5,
            }
        )
        self.assertTrue(any("country_code" in error for error in errors))
        self.assertTrue(any("district" in error for error in errors))

    def test_zero_total_land_is_rejected(self):
        errors = validate_farmer_profile(
            {
                "country_code": "BZ",
                "district": "Cayo",
                "farm_name": "Reyes Farm",
                "total_land_hectares": "0",
                "primary_soil_type": "loam",
                "farming_type": "mixed",
                "years_experience": 5,
            }
        )
        self.assertTrue(any("total_land_hectares" in error for error in errors))

    def test_negative_years_experience_is_rejected(self):
        errors = validate_farmer_profile(
            {
                "country_code": "BZ",
                "district": "Cayo",
                "farm_name": "Reyes Farm",
                "total_land_hectares": "2.50",
                "primary_soil_type": "loam",
                "farming_type": "mixed",
                "years_experience": -1,
            }
        )
        self.assertTrue(any("years_experience" in error for error in errors))


class CropRecordValidationCoreTests(TestCase):
    def test_valid_crop_record_passes_validation(self):
        data = {
            "crop": 1,
            "farm": 1,
            "planting_date": "2026-07-01",
            "expected_harvest_date": "2026-10-01",
            "land_area_used": "2.5",
            "quantity_planted": "500",
            "status": "planted",
        }
        self.assertEqual(validate_crop_record(data), [])

    def test_negative_land_area_is_rejected(self):
        errors = validate_crop_record(
            {
                "crop": 1,
                "farm": 1,
                "planting_date": "2026-07-01",
                "land_area_used": "-1.5",
                "quantity_planted": "500",
                "status": "planted",
            }
        )
        self.assertTrue(any("land_area_used" in error for error in errors))

    def test_zero_land_area_is_rejected(self):
        errors = validate_crop_record(
            {
                "crop": 1,
                "farm": 1,
                "planting_date": "2026-07-01",
                "land_area_used": "0",
                "quantity_planted": "500",
                "status": "planted",
            }
        )
        self.assertTrue(any("land_area_used" in error for error in errors))

    def test_missing_crop_and_farm_are_rejected(self):
        errors = validate_crop_record(
            {
                "planting_date": "2026-07-01",
                "land_area_used": "1.0",
                "quantity_planted": "500",
                "status": "planted",
            }
        )
        self.assertTrue(any("crop is required" in error for error in errors))
        self.assertTrue(any("farm is required" in error for error in errors))

    def test_missing_planting_date_is_rejected(self):
        errors = validate_crop_record(
            {
                "crop": 1,
                "farm": 1,
                "land_area_used": "1.0",
                "quantity_planted": "500",
                "status": "planted",
            }
        )
        self.assertTrue(any("planting_date" in error for error in errors))

    def test_invalid_status_is_rejected(self):
        errors = validate_crop_record(
            {
                "crop": 1,
                "farm": 1,
                "planting_date": "2026-07-01",
                "land_area_used": "1.0",
                "quantity_planted": "500",
                "status": "ready",
            }
        )
        self.assertTrue(any("status" in error for error in errors))

    def test_all_valid_statuses_are_accepted(self):
        for status in VALID_CROP_STATUSES:
            data = {
                "crop": 1,
                "farm": 1,
                "planting_date": "2026-07-01",
                "land_area_used": "1.0",
                "quantity_planted": "500",
                "status": status,
            }
            errors = validate_crop_record(data)
            status_errors = [error for error in errors if "status" in error]
            self.assertEqual(status_errors, [], f"Status '{status}' should be valid")

    def test_invalid_decimal_payload_is_rejected(self):
        errors = validate_crop_record(
            {
                "crop": 1,
                "farm": 1,
                "planting_date": "2026-07-01",
                "land_area_used": "not-a-number",
                "quantity_planted": "500",
                "status": "planted",
            }
        )
        self.assertTrue(any("valid decimal" in error for error in errors))
