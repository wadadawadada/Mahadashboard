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


# ─────────────────────────────────────────────────────────────────────────────
# Pinning test for the first-mahadasha sub-period fix (S4.1 / FR11).
#
# A person born partway through their first mahadasha must have their
# antardashas RESUME mid-sequence from the bhukti running at birth — not
# restart all nine sub-periods from the mahadasha lord. The expected values
# below were COMPUTED BY THE CORRECTED ALGORITHM and are PENDING ASTROLOGER
# SIGN-OFF (see docs/sprints/001-quality-remediation/EXPERT-REVIEW-NEEDED.md).
#
# Fixed chart (no wall-clock): born mid Purva Phalguni (Venus mahadasha),
# ~5 years already elapsed in the 20-year Venus period at birth, observed
# while still in the first mahadasha.
# ─────────────────────────────────────────────────────────────────────────────

_FIRST_MAHA_BIRTH = datetime(1990, 6, 15, 12, 0, tzinfo=timezone.utc)
_FIRST_MAHA_MOON_LON = 136.6667  # Purva Phalguni → Venus mahadasha
_FIRST_MAHA_TODAY = date(1995, 1, 1)  # still inside the (balance) Venus mahadasha


def _first_maha_dashas():
    return calculate_dashas(_FIRST_MAHA_BIRTH, _FIRST_MAHA_MOON_LON, _FIRST_MAHA_TODAY)


def test_first_mahadasha_antardasha_resumes_mid_sequence():
    # PENDING ASTROLOGER SIGN-OFF: identities computed by corrected algorithm.
    dashas = _first_maha_dashas()
    assert dashas.birth_mahadasha == "Venus"

    first = [a for a in dashas.antardashas if a.mahadasha == "Venus"]
    identities = [a.antardasha for a in first]

    # The sequence resumes at Venus-Moon (the bhukti running at birth); the
    # already-elapsed Venus-Venus and Venus-Sun bhuktis are NOT re-emitted.
    assert identities == ["Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury", "Ketu"]
    assert identities[0] != "Venus", "buggy code restarted antardashas from the lord"


def test_first_mahadasha_current_antardasha_identity():
    # PENDING ASTROLOGER SIGN-OFF: the buggy engine reported Venus / Mars here.
    dashas = _first_maha_dashas()
    assert dashas.current.mahadasha == "Venus"
    assert dashas.current.antardasha == "Rahu"
    assert dashas.current.pratyantardasha == "Venus"


def test_first_mahadasha_balance_row_duration_matches_span():
    dashas = _first_maha_dashas()
    balance_row = dashas.mahadashas[0]
    start = datetime.fromisoformat(balance_row.start)
    end = datetime.fromisoformat(balance_row.end)
    span_years = (end - start).total_seconds() / 86400 / 365.25
    # end - start == duration_years (the balance), not the full 20-year period.
    # duration_years is the span rounded to 2 decimals (like balance_days).
    assert abs(span_years - balance_row.duration_years) < 0.01
    assert balance_row.duration_years < 20.0
    assert abs(balance_row.duration_years - 15.0) < 0.01


def test_first_mahadasha_antardashas_tile_balance_period():
    # The resumed antardashas must exactly cover the displayed balance mahadasha.
    dashas = _first_maha_dashas()
    maha = dashas.mahadashas[0]
    first = [a for a in dashas.antardashas if a.mahadasha == "Venus"]
    assert first[0].start == maha.start  # running bhukti clipped to birth
    # Last antardasha ends at the mahadasha end (allowing microsecond float drift
    # from accumulating nine sub-period timedeltas vs one full-span timedelta).
    maha_end = datetime.fromisoformat(maha.end)
    last_end = datetime.fromisoformat(first[-1].end)
    assert abs((maha_end - last_end).total_seconds()) < 2
    for earlier, later in zip(first, first[1:]):
        assert earlier.end == later.start  # contiguous, no gaps/overlaps
