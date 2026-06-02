from datetime import datetime, timezone, date

import pytest

from jyotish.engine.dashas import (
    DASHA_ORDER,
    DASHA_YEARS,
    NAKSHATRA_TO_DASHA,
    calculate_dashas,
)
from jyotish.engine.nakshatra import NAKSHATRAS


def test_dasha_order_length():
    assert len(DASHA_ORDER) == 9


def test_dasha_years_sum():
    assert sum(DASHA_YEARS.values()) == 120


def test_nakshatra_coverage():
    for nk in NAKSHATRAS:
        assert nk in NAKSHATRA_TO_DASHA, f"Missing nakshatra: {nk}"


def test_bharani_maps_to_venus():
    assert NAKSHATRA_TO_DASHA["Bharani"] == "venus"


def test_ashwini_maps_to_ketu():
    assert NAKSHATRA_TO_DASHA["Ashwini"] == "ketu"


def _make_dashas():
    birth = datetime(1979, 7, 15, 18, 36, tzinfo=timezone.utc)
    moon_lon = 17.28  # Bharani nakshatra
    today = date(2025, 1, 1)
    return calculate_dashas(birth, moon_lon, today)


def test_antardasha_inside_mahadasha():
    dashas = _make_dashas()
    maha_map = {m.planet: (m.start, m.end) for m in dashas.mahadashas}
    for a in dashas.antardashas:
        parent_start, parent_end = maha_map[a.mahadasha]
        assert a.start >= parent_start, f"Antardasha {a} starts before mahadasha"
        assert a.end <= parent_end, f"Antardasha {a} ends after mahadasha"


def test_pratyantardasha_inside_antardasha():
    dashas = _make_dashas()
    antar_map = {(a.mahadasha, a.antardasha): (a.start, a.end) for a in dashas.antardashas}
    for p in dashas.pratyantardashas:
        key = (p.mahadasha, p.antardasha)
        if key not in antar_map:
            continue
        a_start, a_end = antar_map[key]
        assert p.start >= a_start
        assert p.end <= a_end


def test_birth_mahadasha_is_venus():
    dashas = _make_dashas()
    assert dashas.birth_mahadasha == "Venus"


def test_current_period_set():
    dashas = _make_dashas()
    assert dashas.current.mahadasha != ""
    assert dashas.current.antardasha != ""


def test_mahadashas_count():
    dashas = _make_dashas()
    assert len(dashas.mahadashas) == 9
