from __future__ import annotations

import swisseph as swe

from jyotish.engine.utils import normalize_longitude

AU_KM = 149_597_870.7

PLANET_IDS: dict[str, int] = {
    "sun": swe.SUN,
    "moon": swe.MOON,
    "mars": swe.MARS,
    "mercury": swe.MERCURY,
    "jupiter": swe.JUPITER,
    "venus": swe.VENUS,
    "saturn": swe.SATURN,
    "rahu": swe.MEAN_NODE,
}


def _setup():
    swe.set_sid_mode(swe.SIDM_LAHIRI)


def calculate_positions(jd: float) -> dict[str, dict]:
    _setup()
    ayanamsa = swe.get_ayanamsa_ut(jd)
    results = {}

    for key, planet_id in PLANET_IDS.items():
        pos, _ = swe.calc_ut(jd, planet_id, swe.FLG_SPEED)
        tropical_lon = pos[0]
        speed = pos[3]
        sidereal_lon = normalize_longitude(tropical_lon - ayanamsa)
        results[key] = {
            "longitude_sidereal": sidereal_lon,
            "retrograde": speed < 0,
            "distance_au": pos[2],
        }

    rahu_lon = results["rahu"]["longitude_sidereal"]
    results["ketu"] = {
        "longitude_sidereal": normalize_longitude(rahu_lon + 180.0),
        "retrograde": False,
    }

    return results


def calculate_moon_distance_km(jd: float) -> float:
    _setup()
    pos, _ = swe.calc_ut(jd, swe.MOON, swe.FLG_SPEED)
    return pos[2] * AU_KM


def calculate_lagna(jd: float, lat: float, lon: float) -> float:
    _setup()
    ayanamsa = swe.get_ayanamsa_ut(jd)
    cusps, ascmc = swe.houses(jd, lat, lon, b"W")
    tropical_asc = ascmc[0]
    return normalize_longitude(tropical_asc - ayanamsa)


def get_ayanamsa(jd: float) -> float:
    _setup()
    return swe.get_ayanamsa_ut(jd)
