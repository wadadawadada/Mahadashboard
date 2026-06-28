"""Deterministic smoke / value tests for previously-untested engine modules
(S7.1 / FR24): ashtakavarga, astrocartography, dignity, houses, ephemeris,
timezone. All inputs are pinned — no wall-clock, no network."""
from datetime import date, datetime, timezone
from pathlib import Path

import pytest

from jyotish.engine.dignity import get_dignity
from jyotish.engine.ephemeris import calculate_lagna, calculate_positions, get_ayanamsa
from jyotish.engine.houses import build_whole_sign_houses
from jyotish.engine.timezone import local_to_utc, to_julian_day
from jyotish.engine.utils import SIGNS

PLACES = Path(__file__).parent.parent / "data" / "places" / "places.json"

# A single pinned chart reused across the module.
_MOSCOW_LAT, _MOSCOW_LON = 55.7558, 37.6173


def _fixed_chart():
    from jyotish.engine.calculator import calculate_chart
    from jyotish.schemas import BirthInput

    birth = BirthInput(
        name="Fixture", birth_date="1990-06-15", birth_time="12:00",
        city="Moscow", country="Russia",
    )
    return calculate_chart(birth, places_path=PLACES, today=date(2020, 1, 1))


def _fixed_jd() -> float:
    utc = local_to_utc("1990-06-15", "12:00", "Europe/Moscow")
    return to_julian_day(utc)


# ── Ashtakavarga ─────────────────────────────────────────────────────────────

def test_ashtakavarga_bav_cells_in_range():
    avarga = _fixed_chart().ashtakavarga
    assert avarga is not None
    classical = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"]
    assert set(avarga.bav.keys()) == set(classical)
    for planet, row in avarga.bav.items():
        assert len(row) == 12
        for cell in row:
            assert 0 <= cell <= 8, f"{planet} BAV cell out of [0,8]: {cell}"


def test_ashtakavarga_sav_matches_column_sums():
    avarga = _fixed_chart().ashtakavarga
    assert len(avarga.sav) == 12
    for house in range(12):
        column_sum = sum(avarga.bav[pk][house] for pk in avarga.bav)
        assert avarga.sav[house] == column_sum
    # The Sarvashtakavarga total equals the sum of every BAV cell.
    total_cells = sum(cell for row in avarga.bav.values() for cell in row)
    assert sum(avarga.sav) == total_cells


def test_ashtakavarga_planet_totals_match_row_sums():
    avarga = _fixed_chart().ashtakavarga
    for planet, row in avarga.bav.items():
        assert avarga.planet_totals[planet] == sum(row)


# ── Ephemeris ────────────────────────────────────────────────────────────────

def test_ephemeris_positions_shape_and_bounds():
    positions = calculate_positions(_fixed_jd())
    expected = {"sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu"}
    assert set(positions.keys()) == expected
    for key, data in positions.items():
        assert 0.0 <= data["longitude_sidereal"] < 360.0
        assert isinstance(data["retrograde"], bool)
    assert positions["sun"]["retrograde"] is False  # Sun is never retrograde
    # Rahu and Ketu are always exactly opposite.
    diff = abs(positions["rahu"]["longitude_sidereal"] - positions["ketu"]["longitude_sidereal"])
    assert abs(diff - 180.0) < 1e-6


def test_ephemeris_lagna_and_ayanamsa_bounds():
    jd = _fixed_jd()
    lagna = calculate_lagna(jd, _MOSCOW_LAT, _MOSCOW_LON)
    assert 0.0 <= lagna < 360.0
    ayanamsa = get_ayanamsa(jd)
    assert 22.0 < ayanamsa < 25.0  # Lahiri ayanamsa in the late 20th century


# ── Timezone ─────────────────────────────────────────────────────────────────

def test_timezone_local_to_utc_offset():
    utc = local_to_utc("1990-06-15", "12:00", "Europe/Moscow")
    assert utc.tzinfo == timezone.utc
    # Moscow summer 1990 was UTC+4, so 12:00 local → 08:00 UTC.
    assert utc.hour == 8 and utc.minute == 0


def test_timezone_parses_optional_seconds():
    without = local_to_utc("1990-06-15", "12:00", "Europe/Moscow")
    with_secs = local_to_utc("1990-06-15", "12:00:30", "Europe/Moscow")
    assert with_secs.second == 30
    assert (with_secs - without).total_seconds() == 30


def test_timezone_julian_day_is_sane():
    jd = to_julian_day(datetime(1990, 6, 15, 8, 0, tzinfo=timezone.utc))
    assert 2447000 < jd < 2449000


# ── Dignity ──────────────────────────────────────────────────────────────────

def test_dignity_known_values():
    assert get_dignity("sun", "Aries") == "exalted"
    assert get_dignity("sun", "Leo") == "own_sign"
    assert get_dignity("sun", "Libra") == "debilitated"
    assert get_dignity("mars", "Gemini") == "neutral"
    assert get_dignity("saturn", "Aquarius") == "own_sign"
    assert get_dignity("moon", "Taurus") == "exalted"


@pytest.mark.parametrize("sign", SIGNS)
def test_dignity_always_returns_known_label(sign):
    for planet in ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu"]:
        assert get_dignity(planet, sign) in {"exalted", "debilitated", "own_sign", "neutral"}


# ── Houses ───────────────────────────────────────────────────────────────────

def test_whole_sign_houses_shape():
    chart = _fixed_chart()
    houses = build_whole_sign_houses(chart.lagna.sign, chart.planets)
    assert sorted(houses.keys(), key=int) == [str(i) for i in range(1, 13)]
    assert houses["1"].sign == chart.lagna.sign
    for number in range(1, 13):
        house = houses[str(number)]
        assert house.number == number
        assert house.sign in SIGNS
        assert house.lord
    # Each of the 12 signs appears exactly once across the houses.
    assert {h.sign for h in houses.values()} == set(SIGNS)


# ── Astrocartography ─────────────────────────────────────────────────────────

def test_astrocartography_lines_shape_and_bounds():
    from jyotish.engine.astrocartography import compute_acg_lines

    result = compute_acg_lines(_fixed_jd(), language="en")
    assert isinstance(result["lines"], list) and result["lines"]
    assert isinstance(result["parans"], list)
    for line in result["lines"]:
        assert {"planet", "angle", "score", "coords"} <= set(line.keys())
        # coords is a list of segments (antimeridian-split); each segment is a
        # list of [lon, lat] points.
        assert isinstance(line["coords"], list)
        for segment in line["coords"]:
            for lon, lat in segment:
                assert -180.0 <= lon <= 180.0
                assert -90.0 <= lat <= 90.0
    for paran in result["parans"]:
        assert -90.0 <= paran["latitude"] <= 90.0
