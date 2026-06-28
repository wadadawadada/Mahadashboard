"""Birth-input validation (S4.4 / FR14) and guarded data-file loads
(S2.3 / FR6)."""
import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from jyotish.engine.location import resolve_location
from jyotish.schemas import BirthInput


def _valid_kwargs(**overrides):
    base = dict(
        birth_date="1990-06-15",
        birth_time="12:00",
        city="Moscow",
        country="Russia",
    )
    base.update(overrides)
    return base


# ── Birth input validation (S4.4) ────────────────────────────────────────────

def test_birth_time_accepts_optional_seconds():
    model = BirthInput(**_valid_kwargs(birth_time="14:30:05"))
    assert model.birth_time == "14:30:05"


def test_birth_time_accepts_hh_mm():
    model = BirthInput(**_valid_kwargs(birth_time="14:30"))
    assert model.birth_time == "14:30"


@pytest.mark.parametrize("bad_time", ["2:30", "14-30", "14:30:05.5", "noon", "1430"])
def test_birth_time_rejects_malformed(bad_time):
    with pytest.raises(ValidationError):
        BirthInput(**_valid_kwargs(birth_time=bad_time))


@pytest.mark.parametrize("bad_date", ["2020-13-40", "20-1-1", "2020/01/01", "01-01-2020", "garbage"])
def test_birth_date_rejects_malformed_shape(bad_date):
    with pytest.raises(ValidationError):
        BirthInput(**_valid_kwargs(birth_date=bad_date))


def test_birth_date_accepts_canonical_shape():
    model = BirthInput(**_valid_kwargs(birth_date="2020-01-01"))
    assert model.birth_date == "2020-01-01"


# ── Guarded places.json load (S2.3) ──────────────────────────────────────────

def test_missing_places_file_raises_clean_value_error(tmp_path):
    missing = tmp_path / "does_not_exist.json"
    with pytest.raises(ValueError, match="not found"):
        resolve_location("Moscow", "Russia", missing)


def test_corrupt_places_file_raises_clean_value_error(tmp_path):
    corrupt = tmp_path / "places.json"
    corrupt.write_text("{ this is not valid json ", encoding="utf-8")
    with pytest.raises(ValueError, match="could not be read"):
        resolve_location("Moscow", "Russia", corrupt)


def test_non_object_places_file_raises_clean_value_error(tmp_path):
    weird = tmp_path / "places.json"
    weird.write_text(json.dumps([1, 2, 3]), encoding="utf-8")
    with pytest.raises(ValueError, match="malformed"):
        resolve_location("Moscow", "Russia", weird)
