from datetime import date
from pathlib import Path

from jyotish.engine.astrocartography import (
    GEO_ALGORITHM_VERSION,
    _compute_parans,
    compute_acg_lines,
)
from jyotish.engine.calculator import calculate_chart
from jyotish.schemas import BirthInput


PLACES = Path(__file__).parent.parent / "data" / "places" / "places.json"


def _line(planet: str, angle: str, coords: list[list[float]]) -> dict:
    return {
        "planet": planet,
        "angle": angle,
        "coords": [coords],
    }


def _make_birth() -> BirthInput:
    return BirthInput(
        name="Test Person",
        birth_date="1979-07-15",
        birth_time="21:36",
        city="Moscow",
        country="Russia",
    )


def test_parans_use_meridian_to_horizon_pairs_and_cluster_adjacent_hits():
    lines = [
        _line("sun", "ASC", [[10.0, -1.0], [10.0, 0.0], [10.0, 1.0]]),
        _line("sun", "MC", [[10.0, -1.0], [10.0, 0.0], [10.0, 1.0]]),
        _line("venus", "ASC", [[11.0, -1.0], [11.0, 0.0], [11.0, 1.0]]),
    ]

    parans = _compute_parans(lines, "en")

    assert len(parans) == 1
    paran = parans[0]
    assert (paran["planet_a"], paran["angle_a"], paran["planet_b"], paran["angle_b"]) == ("sun", "MC", "venus", "ASC")
    assert paran["samples"] == 3
    assert paran["latitude"] == 0.0
    assert paran["longitude"] == 10.5


def test_paran_longitude_stays_on_antimeridian():
    lines = [
        _line("sun", "MC", [[179.0, 0.0]]),
        _line("venus", "ASC", [[-179.0, 0.0]]),
    ]

    parans = _compute_parans(lines, "en")

    assert len(parans) == 1
    assert abs(abs(parans[0]["longitude"]) - 180.0) < 0.01


def test_compute_acg_lines_exposes_current_algorithm_version():
    chart = calculate_chart(_make_birth(), places_path=PLACES, today=date(2025, 1, 1))

    geo = compute_acg_lines(chart.birth.julian_day, language="en")

    assert geo["meta"]["algorithm_version"] == GEO_ALGORITHM_VERSION
    assert len(geo["lines"]) == 36
