import pytest
from pathlib import Path
from jyotish.engine.location import resolve_location

PLACES = Path(__file__).parent.parent / "data" / "places" / "places.json"


def test_moscow_resolves():
    loc = resolve_location("Moscow", "Russia", PLACES)
    assert abs(loc.latitude - 55.7558) < 0.01
    assert abs(loc.longitude - 37.6173) < 0.01
    assert loc.timezone == "Europe/Moscow"


def test_varna_resolves():
    loc = resolve_location("Varna", "Bulgaria", PLACES)
    assert abs(loc.latitude - 43.2141) < 0.01
    assert loc.timezone == "Europe/Sofia"


def test_case_insensitive():
    loc = resolve_location("moscow", "russia", PLACES)
    assert loc.timezone == "Europe/Moscow"


def test_unknown_city_raises():
    with pytest.raises(ValueError, match="Location could not be resolved"):
        resolve_location("Zzzxyz", "Nowhere", PLACES)
