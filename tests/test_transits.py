"""Transit-engine tests: Dhanishta spelling unification (S4.3 / FR13) and a
deterministic forecast smoke test (S7.1 / FR24)."""
from datetime import date
from pathlib import Path

from jyotish.engine.transits import (
    _HAIRCUT_NK_BAD,
    _NAKSHATRA_NATURE,
    _build_indicators,
    calculate_forecast,
)

PLACES = Path(__file__).parent.parent / "data" / "places" / "places.json"


def _moon_in(nakshatra: str) -> dict:
    return {
        "planet": "moon",
        "nakshatra": nakshatra,
        "pada": 1,
        "dignity": "neutral",
        "retrograde": False,
    }


def test_dhanishta_spelling_is_canonical_everywhere():
    # Canonical list uses "Dhanishta"; the transit tables must agree (no split).
    assert "Dhanishta" in _NAKSHATRA_NATURE
    assert "Dhanishta" in _HAIRCUT_NK_BAD
    assert "Dhanishtha" not in _NAKSHATRA_NATURE
    assert "Dhanishtha" not in _HAIRCUT_NK_BAD


def test_moon_in_dhanishta_is_scored_not_silently_missed():
    # Before the fix, Moon in "Dhanishta" missed the "Dhanishtha"-keyed tables,
    # silently defaulting haircut/travel to neutral/good. After unification the
    # nakshatra is recognized and both indicators rate it "bad".
    lunar_phase = {"tithi": 5, "paksha": "shukla"}
    indicators = _build_indicators([_moon_in("Dhanishta")], lunar_phase)
    ratings = {i["id"]: i["rating"] for i in indicators}

    assert ratings["haircut"] == "bad"
    assert ratings["travel"] == "bad"


def test_forecast_smoke_shape_and_bounds():
    from jyotish.engine.calculator import calculate_chart
    from jyotish.schemas import BirthInput

    birth = BirthInput(
        name="Smoke", birth_date="1990-06-15", birth_time="12:00",
        city="Moscow", country="Russia",
    )
    chart = calculate_chart(birth, places_path=PLACES, today=date(2020, 1, 1))
    forecast = calculate_forecast(chart, date(2020, 1, 1), language="en")

    assert 0 <= forecast["score"] <= 100
    assert forecast["date"] == "2020-01-01"
    assert forecast["active_dasha"]["mahadasha"]
    assert isinstance(forecast["indicators"], list) and forecast["indicators"]
    assert isinstance(forecast["transit_planets"], list)
    assert len(forecast["sav"]) == 12
    for indicator in forecast["indicators"]:
        assert indicator["rating"] in {"good", "neutral", "bad"}
