from __future__ import annotations

import json
from pathlib import Path

from jyotish.schemas import ResolvedLocation


def resolve_location(city: str, country: str, places_path: Path) -> ResolvedLocation:
    key = f"{city.lower()},{country.lower()}"

    with open(places_path, encoding="utf-8") as f:
        places = json.load(f)

    if key in places:
        entry = places[key]
        return ResolvedLocation(
            city_key=key,
            display_name=entry["name"],
            latitude=entry["lat"],
            longitude=entry["lon"],
            timezone=entry["timezone"],
        )

    lat, lon, tz = _try_geopy(city, country)
    if lat is not None:
        return ResolvedLocation(
            city_key=key,
            display_name=f"{city}, {country}",
            latitude=lat,
            longitude=lon,
            timezone=tz,
        )

    raise ValueError(
        f"Location could not be resolved. Add city to data/places/places.json: '{key}'"
    )


def _try_geopy(city: str, country: str):
    try:
        from geopy.geocoders import Nominatim
        from timezonefinder import TimezoneFinder

        geolocator = Nominatim(user_agent="jyotish-agent/0.1", timeout=5)
        location = geolocator.geocode(f"{city}, {country}")
        if location is None:
            return None, None, None

        tf = TimezoneFinder()
        tz = tf.timezone_at(lat=location.latitude, lng=location.longitude)
        if tz is None:
            return None, None, None

        return location.latitude, location.longitude, tz
    except Exception:
        return None, None, None
