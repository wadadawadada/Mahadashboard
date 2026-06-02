"""
Ashtakavarga — classic Jyotish 8-source benefic point system.

Each of the 7 classical planets (Sun through Saturn) contributes points to
every house from 8 sources (itself + 7 others). The result is a 7×12 grid
of benefic counts (0–8 per cell) plus Sarvashtakavarga (column sums, 0–56).

Reference positions (which house number each planet must occupy relative to
a reference planet/lagna to grant a benefic point) are the traditional tables
from Brihat Parashara Hora Shastra.
"""
from __future__ import annotations

from jyotish.engine.utils import SIGNS

# ── Traditional benefic positions for each receiving planet ───────────────
# Key   = planet receiving the analysis
# Value = dict mapping "contributor" → list of house offsets (1-based) from
#         that contributor's own position that are benefic.
# Source: BPHS Ashtakavarga chapter (widely agreed tables).

_BENEFIC_OFFSETS: dict[str, dict[str, list[int]]] = {
    "sun": {
        "sun":     [1, 2, 4, 7, 8, 9, 10, 11],
        "moon":    [3, 6, 10, 11],
        "mars":    [1, 2, 4, 7, 8, 9, 10, 11],
        "mercury": [3, 5, 6, 9, 10, 11, 12],
        "jupiter": [5, 6, 9, 11],
        "venus":   [6, 7, 12],
        "saturn":  [1, 2, 4, 7, 8, 9, 10, 11],
        "lagna":   [1, 2, 4, 7, 8, 9, 10, 11],
    },
    "moon": {
        "sun":     [3, 6, 7, 8, 10, 11],
        "moon":    [1, 3, 6, 7, 10, 11],
        "mars":    [2, 3, 5, 6, 9, 10, 11],
        "mercury": [1, 3, 4, 5, 7, 8, 10, 11],
        "jupiter": [1, 4, 7, 8, 10, 11, 12],
        "venus":   [3, 4, 5, 7, 9, 10, 11],
        "saturn":  [3, 5, 6, 11],
        "lagna":   [3, 6, 10, 11],
    },
    "mars": {
        "sun":     [3, 5, 6, 10, 11],
        "moon":    [3, 6, 11],
        "mars":    [1, 2, 4, 7, 8, 10, 11],
        "mercury": [3, 5, 6, 11],
        "jupiter": [6, 10, 11, 12],
        "venus":   [6, 8, 11, 12],
        "saturn":  [1, 4, 7, 8, 9, 10, 11],
        "lagna":   [1, 3, 6, 10, 11],
    },
    "mercury": {
        "sun":     [5, 6, 9, 11, 12],
        "moon":    [2, 4, 6, 8, 10, 11],
        "mars":    [1, 2, 4, 7, 8, 9, 10, 11],
        "mercury": [1, 3, 5, 6, 9, 10, 11, 12],
        "jupiter": [6, 8, 11, 12],
        "venus":   [1, 2, 3, 4, 5, 8, 9, 11],
        "saturn":  [1, 2, 4, 7, 8, 9, 10, 11],
        "lagna":   [1, 2, 4, 6, 8, 10, 11],
    },
    "jupiter": {
        "sun":     [1, 2, 3, 4, 7, 8, 9, 10, 11],
        "moon":    [2, 5, 7, 9, 11],
        "mars":    [1, 2, 4, 7, 8, 10, 11],
        "mercury": [1, 2, 4, 5, 6, 9, 10, 11],
        "jupiter": [1, 2, 3, 4, 7, 8, 10, 11],
        "venus":   [2, 5, 6, 9, 10, 11],
        "saturn":  [3, 5, 6, 12],
        "lagna":   [1, 2, 4, 5, 6, 7, 9, 10, 11],
    },
    "venus": {
        "sun":     [8, 11, 12],
        "moon":    [1, 2, 3, 4, 5, 8, 9, 11, 12],
        "mars":    [3, 4, 6, 9, 11, 12],
        "mercury": [3, 5, 6, 9, 11],
        "jupiter": [5, 8, 9, 10, 11],
        "venus":   [1, 2, 3, 4, 5, 8, 9, 10, 11],
        "saturn":  [3, 4, 5, 8, 9, 10, 11],
        "lagna":   [1, 2, 3, 4, 5, 8, 9, 11],
    },
    "saturn": {
        "sun":     [1, 2, 4, 7, 8, 10, 11],
        "moon":    [3, 6, 11],
        "mars":    [3, 5, 6, 10, 11, 12],
        "mercury": [6, 8, 9, 10, 11, 12],
        "jupiter": [5, 6, 11, 12],
        "venus":   [6, 11, 12],
        "saturn":  [3, 5, 6, 11],
        "lagna":   [1, 3, 4, 6, 10, 11],
    },
}

_CLASSICAL_PLANETS = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"]


def _sign_to_house_offset(planet_sign: str, reference_sign: str) -> int:
    """1-based house offset of planet_sign from reference_sign."""
    ref_idx = SIGNS.index(reference_sign)
    pl_idx = SIGNS.index(planet_sign)
    return (pl_idx - ref_idx) % 12 + 1


def calculate_ashtakavarga(
    natal_planets: dict,   # key → PlanetData  (from chart.planets)
    natal_lagna_sign: str,
) -> dict:
    """
    Returns:
      {
        "bav": {
          "sun":     [p1, p2, … p12],   # 12 house scores for each planet
          …
          "saturn":  [p1 … p12],
        },
        "sav": [s1, s2, … s12],          # Sarvashtakavarga (column sums)
        "planet_totals": {"sun": N, …},  # row sums (strength of planet)
      }
    """
    # Map planet key → sign (use only classical 7)
    planet_signs: dict[str, str] = {}
    for pk in _CLASSICAL_PLANETS:
        pd = natal_planets.get(pk)
        if pd:
            planet_signs[pk] = pd.sign if hasattr(pd, "sign") else pd["sign"]

    # 12-house BAV grid for each classical planet
    bav: dict[str, list[int]] = {pk: [0] * 12 for pk in _CLASSICAL_PLANETS}

    for receiving_planet in _CLASSICAL_PLANETS:
        offsets_map = _BENEFIC_OFFSETS[receiving_planet]

        for contributor, benefic_offsets in offsets_map.items():
            # Determine the reference sign for this contributor
            if contributor == "lagna":
                ref_sign = natal_lagna_sign
            else:
                ref_sign = planet_signs.get(contributor)
                if ref_sign is None:
                    continue

            # For each of the 12 signs, check if it earns a point
            for house_idx in range(12):  # 0=house1 … 11=house12
                sign = SIGNS[house_idx]
                offset = _sign_to_house_offset(sign, ref_sign)
                if offset in benefic_offsets:
                    bav[receiving_planet][house_idx] += 1

    # Sarvashtakavarga — sum across all 7 planets per house
    sav = [sum(bav[pk][h] for pk in _CLASSICAL_PLANETS) for h in range(12)]

    # Planet totals (row sums)
    planet_totals = {pk: sum(bav[pk]) for pk in _CLASSICAL_PLANETS}

    return {"bav": bav, "sav": sav, "planet_totals": planet_totals}
