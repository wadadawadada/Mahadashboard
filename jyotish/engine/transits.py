"""
Transit chart calculation for a given date over a natal chart.

Returns a structured ForecastOutput containing:
  - transit planet positions (sign, house in natal chart, nakshatra, dignity, retrograde)
  - transit-to-natal aspects (conjunctions, oppositions, trines, squares, sextiles — Jyotish style)
  - active dasha / antardasha / pratyantardasha on that date
  - ashtakavarga scores per transit planet in its transiting house
  - lunar phase (tithi, paksha, phase name, illumination %)
  - daily score (0–100) and quality label
  - tips / warnings derived from the above
"""
from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Optional

from jyotish.engine.ashtakavarga import _CLASSICAL_PLANETS, calculate_ashtakavarga
from jyotish.engine.dashas import _find_current
from jyotish.engine.dignity import get_dignity
from jyotish.engine.ephemeris import calculate_positions
from jyotish.engine.nakshatra import get_nakshatra, get_pada
from jyotish.engine.timezone import to_julian_day
from jyotish.engine.utils import SIGNS, format_degree, normalize_key
from jyotish.engine.zodiac import get_sign, get_sign_degree

# ── Jyotish special aspects ───────────────────────────────────────────────
_SPECIAL_ASPECTS: dict[str, list[int]] = {
    "mars":    [4, 7, 8],
    "jupiter": [5, 7, 9],
    "saturn":  [3, 7, 10],
    "rahu":    [5, 7, 9],
    "ketu":    [5, 7, 9],
}
_DEFAULT_ASPECTS = [7]

# ── Benefic / malefic base weights ───────────────────────────────────────
# Moon weight is dynamic (phase-adjusted), this is the waning baseline
_PLANET_NATURE: dict[str, float] = {
    "sun":     -0.1,
    "moon":     0.0,   # overridden by phase below
    "mars":    -0.8,
    "mercury":  0.4,
    "jupiter":  1.0,
    "venus":    0.9,
    "saturn":  -0.8,
    "rahu":    -0.6,
    "ketu":    -0.4,
}

# Dignity modifiers
_DIGNITY_MOD: dict[str, float] = {
    "exalted":     2.0,
    "own_sign":    1.4,
    "neutral":     1.0,
    "debilitated": 0.4,
}

# House modifiers for transit — classical Jyotish
# Good transit houses: 3, 6, 10, 11
# Neutral: 1, 2, 5, 9 (sensitive for malefics, ok for benefics)
# Bad: 4, 7, 8, 12
_HOUSE_MOD: dict[int, float] = {
    1:  0.3,
    2:  0.0,
    3:  1.0,
    4: -0.8,
    5:  0.3,
    6:  0.8,
    7: -0.5,
    8: -1.0,
    9:  0.5,
    10: 1.0,
    11: 1.2,
    12: -0.7,
}

# Aspect quality modifiers
_ASPECT_QUALITY: dict[str, float] = {
    "conjunction": 0.0,   # sign-adjusted below
    "trine":       1.0,
    "sextile":     0.6,
    "square":     -0.8,
    "opposition": -0.5,
}

# ── Nakshatra nature (27 nakshatras in order) ─────────────────────────────
# +1 benefic, 0 neutral, -1 malefic
_NAKSHATRA_NATURE: dict[str, float] = {
    "Ashwini":      0.8,
    "Bharani":     -0.6,
    "Krittika":    -0.4,
    "Rohini":       1.0,
    "Mrigashira":   0.6,
    "Ardra":       -0.8,
    "Punarvasu":    0.8,
    "Pushya":       1.0,
    "Ashlesha":    -0.6,
    "Magha":       -0.2,
    "Purva Phalguni": 0.6,
    "Uttara Phalguni": 0.8,
    "Hasta":        0.6,
    "Chitra":       0.2,
    "Swati":        0.4,
    "Vishakha":     0.0,
    "Anuradha":     0.6,
    "Jyeshtha":    -0.4,
    "Mula":        -0.8,
    "Purva Ashadha": 0.4,
    "Uttara Ashadha": 0.8,
    "Shravana":     0.6,
    "Dhanishtha":   0.4,
    "Shatabhisha":  -0.2,
    "Purva Bhadrapada": -0.4,
    "Uttara Bhadrapada": 0.6,
    "Revati":       0.8,
}

# Tithi quality: tithis 1–15 (shukla) and 16–30 (krishna)
# Auspicious: 1,2,3,5,7,10,11,12,13 (shukla), mostly odd krishna
# Inauspicious: 4,6,8,9,14,15,19,21,29,30
_TITHI_MOD: dict[int, float] = {
    1: 0.6, 2: 0.4, 3: 0.4, 4: -0.4, 5: 0.8,
    6: -0.6, 7: 0.6, 8: -0.4, 9: -0.6, 10: 0.6,
    11: 0.8, 12: 0.6, 13: 0.4, 14: -0.6, 15: -0.2,   # 15 = Purnima (full moon, mixed)
    16: 0.6, 17: 0.4, 18: 0.2, 19: -0.4, 20: 0.4,
    21: -0.4, 22: 0.2, 23: 0.4, 24: 0.6, 25: 0.4,
    26: 0.2, 27: -0.2, 28: -0.4, 29: -0.8, 30: -0.4,  # 30 = Amavasya (new moon)
}

# ── Yoga (27 Sun+Moon combinations) ──────────────────────────────────────────
# Yoga index = int((sun_lon + moon_lon) / (360/27)), 0-based → yoga 1..27
# Quality: +1 auspicious, 0 neutral, -1 inauspicious
_YOGA_NAMES = [
    "Vishkambha","Priti","Ayushman","Saubhagya","Shobhana",
    "Atiganda","Sukarma","Dhriti","Shula","Ganda",
    "Vriddhi","Dhruva","Vyaghata","Harshana","Vajra",
    "Siddhi","Vyatipata","Variyan","Parigha","Shiva",
    "Siddha","Sadhya","Shubha","Shukla","Brahma",
    "Indra","Vaidhriti",
]
_YOGA_QUALITY: dict[str, float] = {
    "Vishkambha": -0.8, "Priti": 1.0,    "Ayushman": 0.8,  "Saubhagya": 1.0,
    "Shobhana":   0.8,  "Atiganda": -0.6, "Sukarma": 0.6,   "Dhriti": 0.6,
    "Shula":     -0.6,  "Ganda": -0.6,   "Vriddhi": 0.8,   "Dhruva": 0.8,
    "Vyaghata":  -0.8,  "Harshana": 0.6, "Vajra": -0.4,    "Siddhi": 1.0,
    "Vyatipata": -1.0,  "Variyan": 0.4,  "Parigha": -0.8,  "Shiva": 0.8,
    "Siddha":     1.0,  "Sadhya": 0.6,   "Shubha": 1.0,    "Shukla": 0.8,
    "Brahma":     0.8,  "Indra": 0.8,    "Vaidhriti": -1.0,
}

# ── Karana (11 types, half-tithi) ─────────────────────────────────────────────
# Each tithi has 2 karanas. Fixed karanas: Shakuni(57), Chatushpada(58),
# Nagava(59), Kimstughna(60). Movable karanas cycle 1..7 for positions 1..56.
_KARANA_MOVABLE = ["Bava","Balava","Kaulava","Taitila","Garija","Vanija","Vishti"]
_KARANA_QUALITY: dict[str, float] = {
    "Bava": 0.6, "Balava": 0.8, "Kaulava": 0.6, "Taitila": 0.4,
    "Garija": 0.4, "Vanija": 0.8, "Vishti": -1.0,  # Vishti (Bhadra) = very inauspicious
    "Shakuni": -0.4, "Chatushpada": -0.2, "Nagava": -0.2, "Kimstughna": 0.2,
}


def _calc_yoga_karana(sun_lon: float, moon_lon: float) -> dict:
    """Calculate Yoga and Karana from sidereal Sun+Moon longitudes."""
    # Yoga: (sun + moon) / (360/27), 0-based index
    yoga_idx = int(((sun_lon + moon_lon) % 360) / (360 / 27))
    yoga_name = _YOGA_NAMES[yoga_idx % 27]

    # Karana: each tithi has 2 karanas (first and second half)
    elongation = (moon_lon - sun_lon) % 360
    karana_pos = int(elongation / 6)  # 0..59

    if karana_pos == 0:
        karana_name = "Kimstughna"
    elif karana_pos <= 56:
        karana_name = _KARANA_MOVABLE[(karana_pos - 1) % 7]
    elif karana_pos == 57:
        karana_name = "Shakuni"
    elif karana_pos == 58:
        karana_name = "Chatushpada"
    elif karana_pos == 59:
        karana_name = "Nagava"
    else:
        karana_name = "Bava"

    return {
        "yoga_name": yoga_name,
        "yoga_quality": _YOGA_QUALITY.get(yoga_name, 0.0),
        "karana_name": karana_name,
        "karana_quality": _KARANA_QUALITY.get(karana_name, 0.0),
    }


def _house_from_sign(transit_sign: str, natal_lagna_sign: str) -> int:
    lagna_idx = SIGNS.index(natal_lagna_sign)
    transit_idx = SIGNS.index(transit_sign)
    return (transit_idx - lagna_idx) % 12 + 1


def _aspects_from_house(from_house: int, planet_key: str) -> list[int]:
    offsets = _SPECIAL_ASPECTS.get(planet_key, _DEFAULT_ASPECTS)
    result = []
    for off in offsets:
        h = (from_house - 1 + off - 1) % 12 + 1
        result.append(h)
    return result


def _western_aspect_name(deg_diff: float) -> Optional[str]:
    # Tight orbs (≤3°) so only genuinely close aspects influence the score.
    d = deg_diff % 360
    if d > 180:
        d = 360 - d
    if d <= 3:
        return "conjunction"
    if abs(d - 60) <= 3:
        return "sextile"
    if abs(d - 90) <= 3:
        return "square"
    if abs(d - 120) <= 3:
        return "trine"
    if abs(d - 180) <= 3:
        return "opposition"
    return None


def _calc_lunar_phase(moon_lon: float, sun_lon: float) -> dict:
    """
    Compute lunar phase data from sidereal longitudes.
    Returns tithi (1–30), paksha, phase_name, illumination_pct, elongation.
    """
    elongation = (moon_lon - sun_lon) % 360
    tithi = int(elongation / 12) + 1  # 1–30
    paksha = "shukla" if tithi <= 15 else "krishna"
    illumination = round(50 * (1 - __import__("math").cos(__import__("math").radians(elongation))), 1)

    if tithi == 30 or tithi == 1:
        phase_name = "Амавасья" if tithi == 30 else "Пратипада"
    elif tithi == 15:
        phase_name = "Пурнима"
    elif tithi <= 7:
        phase_name = "Растущая"
    elif tithi <= 14:
        phase_name = "Почти полная"
    elif tithi <= 22:
        phase_name = "Убывающая"
    else:
        phase_name = "Почти новолуние"

    phase_name_en_map = {
        "Амавасья": "New Moon",
        "Пратипада": "Waxing Crescent",
        "Пурнима": "Full Moon",
        "Растущая": "Waxing",
        "Почти полная": "Waxing Gibbous",
        "Убывающая": "Waning",
        "Почти новолуние": "Waning Crescent",
    }

    return {
        "tithi": tithi,
        "paksha": paksha,
        "phase_name_ru": phase_name,
        "phase_name_en": phase_name_en_map.get(phase_name, phase_name),
        "illumination_pct": illumination,
        "elongation_deg": round(elongation, 2),
    }


def calculate_forecast(
    natal_chart,
    forecast_date: date,
    language: str = "ru",
    score_method: str = "mix",
) -> dict:
    # ── 1. Julian Day for noon UTC on forecast_date ──────────────────────
    noon_utc = datetime(forecast_date.year, forecast_date.month, forecast_date.day,
                        12, 0, 0, tzinfo=timezone.utc)
    jd = to_julian_day(noon_utc)

    # ── 2. Transit planet positions ──────────────────────────────────────
    raw_transit = calculate_positions(jd)
    natal_lagna_sign: str = natal_chart.lagna.sign

    transit_planets: list[dict] = []
    for pk, raw in raw_transit.items():
        lon = raw["longitude_sidereal"]
        sign = get_sign(lon)
        sign_deg = get_sign_degree(lon)
        nakshatra = get_nakshatra(lon)
        pada = get_pada(lon)
        dignity = get_dignity(pk, sign)
        retrograde = raw["retrograde"]
        house = _house_from_sign(sign, natal_lagna_sign)

        transit_planets.append({
            "planet": pk,
            "sign": sign,
            "house": house,
            "degree_formatted": format_degree(sign_deg),
            "nakshatra": nakshatra,
            "pada": pada,
            "dignity": dignity,
            "retrograde": retrograde,
            "longitude_sidereal": round(lon, 4),
        })

    # ── 2b. Lunar phase + Panchanga ──────────────────────────────────────
    moon_tp = next((t for t in transit_planets if t["planet"] == "moon"), None)
    sun_tp  = next((t for t in transit_planets if t["planet"] == "sun"), None)
    lunar_phase: Optional[dict] = None
    panchanga: Optional[dict] = None
    if moon_tp and sun_tp:
        lunar_phase = _calc_lunar_phase(
            moon_tp["longitude_sidereal"],
            sun_tp["longitude_sidereal"],
        )
        yk = _calc_yoga_karana(
            sun_tp["longitude_sidereal"],
            moon_tp["longitude_sidereal"],
        )
        panchanga = {**lunar_phase, **yk}

    # ── 3. Transit-to-natal aspects ──────────────────────────────────────
    transit_aspects: list[dict] = []
    natal_planets = natal_chart.planets

    for tp in transit_planets:
        tr_lon = tp["longitude_sidereal"]
        for np_key, np_data in natal_planets.items():
            nat_lon = np_data.longitude_sidereal
            diff = abs(tr_lon - nat_lon)
            aspect_name = _western_aspect_name(diff)
            if aspect_name:
                transit_aspects.append({
                    "transit_planet": tp["planet"],
                    "natal_planet": np_key,
                    "aspect": aspect_name,
                    "orb": round(min(diff % 360, 360 - diff % 360), 2),
                })

        tr_house = tp["house"]
        aspected_houses = _aspects_from_house(tr_house, tp["planet"])
        for asp_house in aspected_houses:
            transit_aspects.append({
                "transit_planet": tp["planet"],
                "aspected_house": asp_house,
                "aspect": "jyotish_aspect",
                "orb": 0,
            })

    # ── 4. Active dasha on forecast_date ─────────────────────────────────
    dashas = natal_chart.dashas
    maha, antar, pratya = _find_current(
        dashas.mahadashas,
        dashas.antardashas,
        dashas.pratyantardashas,
        forecast_date,
    )

    antar_remaining_days: Optional[float] = None
    for a in dashas.antardashas:
        if a.mahadasha == maha and a.antardasha == antar:
            a_end = datetime.fromisoformat(a.end)
            forecast_dt = datetime(forecast_date.year, forecast_date.month,
                                   forecast_date.day, tzinfo=timezone.utc)
            antar_remaining_days = max(0.0, (a_end - forecast_dt).days)
            break

    active_dasha = {
        "mahadasha": maha,
        "antardasha": antar,
        "pratyantardasha": pratya,
        "antardasha_remaining_days": antar_remaining_days,
        "interp_keys": [
            f"dasha:{maha.lower()}:mahadasha",
            f"dasha:{maha.lower()}:{antar.lower()}" if antar else None,
        ],
    }
    active_dasha["interp_keys"] = [k for k in active_dasha["interp_keys"] if k]

    # ── 5. Ashtakavarga for transit houses ───────────────────────────────
    avarga = calculate_ashtakavarga(natal_chart.planets, natal_lagna_sign)
    bav = avarga["bav"]
    sav = avarga["sav"]

    transit_avarga: list[dict] = []
    for tp in transit_planets:
        pk = tp["planet"]
        house_idx = tp["house"] - 1
        bav_score = bav.get(pk, [0] * 12)[house_idx] if pk in bav else None
        sav_score = sav[house_idx]
        transit_avarga.append({
            "planet": pk,
            "house": tp["house"],
            "bav": bav_score,
            "sav": sav_score,
        })

    # ── 6. Daily score (0–100) ────────────────────────────────────────────
    score = _calculate_daily_score(
        transit_planets, transit_aspects, active_dasha,
        transit_avarga, natal_chart, lunar_phase,
        panchanga=panchanga, score_method=score_method,
    )

    # ── 7. Interpretation keys ───────────────────────────────────────────
    interp_keys: list[str] = []
    for tp in transit_planets:
        pk = tp["planet"]
        sign_key = normalize_key(tp["sign"])
        nk_key = normalize_key(tp["nakshatra"])
        interp_keys.append(f"transit:{pk}:sign:{sign_key}")
        interp_keys.append(f"transit:{pk}:house:{tp['house']}")
        interp_keys.append(f"transit:{pk}:nakshatra:{nk_key}")
        if tp["dignity"] != "neutral":
            interp_keys.append(f"transit:{pk}:dignity:{tp['dignity']}")
    interp_keys.extend(active_dasha["interp_keys"])
    interp_keys.extend([f"dasha:{maha.lower()}:mahadasha"])
    if antar:
        interp_keys.append(f"dasha:{maha.lower()}:{antar.lower()}")
    seen: set[str] = set()
    unique_keys: list[str] = []
    for k in interp_keys:
        if k not in seen:
            seen.add(k)
            unique_keys.append(k)

    # ── 8. Tips / warnings ───────────────────────────────────────────────
    tips = _build_tips(transit_planets, transit_aspects, active_dasha,
                       transit_avarga, score, language, lunar_phase, natal_chart)

    # ── 9. Activity indicators ───────────────────────────────────────────
    indicators = _build_indicators(transit_planets, lunar_phase)

    return {
        "date": forecast_date.isoformat(),
        "language": language,
        "score": score,
        "score_method": score_method,
        "active_dasha": active_dasha,
        "lunar_phase": lunar_phase,
        "panchanga": panchanga,
        "transit_planets": transit_planets,
        "transit_aspects": transit_aspects,
        "transit_avarga": transit_avarga,
        "sav": sav,
        "bav": bav,
        "interp_keys": unique_keys,
        "tips": tips,
        "indicators": indicators,
    }


# ── Score calculation ─────────────────────────────────────────────────────

def _calculate_score_jyotish(
    transit_planets, transit_aspects, active_dasha,
    transit_avarga, natal_chart, lunar_phase: Optional[dict],
    panchanga: Optional[dict],
) -> int:
    """
    Pure Jyotish scoring model:
    - Panchanga (Tithi + Yoga + Karana) as primary daily quality signal
    - Ashtakavarga (BAV) as the main transit strength measure
    - Jyotish-style house aspects only (no western degree aspects)
    - Dasha lord quality = intrinsic nature + functional nature by house rulership
      + where the dasha lord is transiting right now
    - Moon nakshatra quality as secondary modifier
    """
    score = 50.0

    # ── A. Panchanga — the five daily quality elements ────────────────────
    # Tithi (lunar day), Yoga (Sun+Moon combination), Karana (half-tithi)
    # are the backbone of daily Jyotish forecasting.
    if panchanga:
        tithi    = panchanga.get("tithi", 15)
        tithi_q  = _TITHI_MOD.get(tithi, 0.0)
        yoga_q   = panchanga.get("yoga_quality", 0.0)
        karana_q = panchanga.get("karana_quality", 0.0)
        # Weights: Tithi=most important, Yoga=strong, Karana=moderate
        score += tithi_q * 10.0 + yoga_q * 8.0 + karana_q * 5.0

    # ── B. Moon nakshatra quality ─────────────────────────────────────────
    moon_tp = next((t for t in transit_planets if t["planet"] == "moon"), None)
    if moon_tp:
        nk_q = _NAKSHATRA_NATURE.get(moon_tp["nakshatra"], 0.0)
        score += nk_q * 7.0

        # Moon dignity amplifier
        dignity = moon_tp["dignity"]
        dig_bonus = {"exalted": +1.5, "own_sign": +0.8, "neutral": 0.0, "debilitated": -1.5}.get(dignity, 0.0)
        score += dig_bonus * 2.0

    # ── C. Ashtakavarga — primary transit strength ────────────────────────
    # BAV ≥5 in a house = strong transit support; <4 = weak/difficult.
    # This is the classical Jyotish transit evaluation method.
    for av in transit_avarga:
        pk  = av["planet"]
        bav = av.get("bav")
        sav = av.get("sav", 28)
        if bav is None:
            continue
        planet_nature = _PLANET_NATURE.get(pk, 0.0)
        # Strong BAV in a house amplifies benefic transits, cushions malefics.
        # Weak BAV makes even benefic planets less effective.
        bav_strength = (bav - 4) / 4.0   # -1.0 at bav=0, +1.0 at bav=8
        if pk == "moon":
            # Moon BAV is most sensitive — doubled weight
            score += bav_strength * 8.0
        else:
            # For other planets: benefic with high BAV = good, malefic with low BAV = bad
            if planet_nature >= 0:
                score += bav_strength * 3.0
            else:
                # Malefic: high BAV reduces harm, low BAV amplifies it
                score += bav_strength * 2.0 * (-1 if bav < 4 else 0.5)
        # SAV: house vitality across all planets
        score += (sav - 28) * 0.08

    # ── D. Jyotish house aspects (graha drishti) ─────────────────────────
    # Each transit planet aspects specific houses by Jyotish rules.
    # Benefic aspecting a good house = positive; malefic aspecting bad house = negative.
    _KENDRA   = {1, 4, 7, 10}
    _TRIKONA  = {1, 5, 9}
    _DUSTHANA = {6, 8, 12}

    for asp in transit_aspects:
        if asp.get("aspect") != "jyotish_aspect":
            continue
        tr_pk      = asp["transit_planet"]
        asp_house  = asp.get("aspected_house", 0)
        nature     = _PLANET_NATURE.get(tr_pk, 0.0)

        if asp_house in _KENDRA or asp_house in _TRIKONA:
            house_q = 1.0   # aspecting an auspicious house
        elif asp_house in _DUSTHANA:
            house_q = -1.0  # aspecting a difficult house
        else:
            house_q = 0.2   # neutral houses (2, 3, 11 etc.)

        contribution = nature * house_q * 1.5
        score += contribution

    # ── E. Dasha lords — functional nature + transit position ────────────
    # In Jyotish, how a period lord performs depends on:
    #   1. Its natural benefic/malefic nature
    #   2. Which houses it rules for this lagna (functional nature)
    #   3. Where it is transiting right now (transit house quality)
    def _functional_nature(planet_key: str) -> float:
        base = _PLANET_NATURE.get(planet_key, 0.0)
        if not planet_key or not natal_chart:
            return base
        np = natal_chart.planets.get(planet_key)
        if np is None:
            return base
        ruled = getattr(np, "ruler_of_houses", [])
        mod = 0.0
        for h in ruled:
            if h in _KENDRA or h in _TRIKONA:
                mod += 0.5
            if h in _DUSTHANA:
                mod -= 0.7
        return base + mod

    def _transit_house_quality(planet_key: str) -> float:
        tp = next((t for t in transit_planets if t["planet"] == planet_key), None)
        if tp is None:
            return 0.0
        return _HOUSE_MOD.get(tp["house"], 0.0)

    maha  = active_dasha["mahadasha"].lower()
    antar = (active_dasha["antardasha"] or "").lower()
    pratya = (active_dasha.get("pratyantardasha") or "").lower()

    maha_fn   = _functional_nature(maha)
    antar_fn  = _functional_nature(antar)
    pratya_fn = _functional_nature(pratya)

    # Transit position of the period lord matters most for the shorter periods
    maha_transit_q   = _transit_house_quality(maha)
    antar_transit_q  = _transit_house_quality(antar)
    pratya_transit_q = _transit_house_quality(pratya)

    score += (maha_fn  + maha_transit_q  * 0.5) * 3.0
    score += (antar_fn + antar_transit_q * 0.8) * 5.0
    score += (pratya_fn + pratya_transit_q)      * 2.0

    return max(5, min(95, round(score)))


def _calculate_daily_score(
    transit_planets, transit_aspects, active_dasha,
    transit_avarga, natal_chart, lunar_phase: Optional[dict],
    panchanga: Optional[dict] = None,
    score_method: str = "mix",
) -> int:
    if score_method == "jyotish":
        return _calculate_score_jyotish(
            transit_planets, transit_aspects, active_dasha,
            transit_avarga, natal_chart, lunar_phase, panchanga,
        )
    # ── "mix" method (default) ────────────────────────────────────────────
    score = 50.0

    # ── A. Moon — primary daily driver ───────────────────────────────────
    moon_tp = next((t for t in transit_planets if t["planet"] == "moon"), None)
    if moon_tp:
        tithi = lunar_phase["tithi"] if lunar_phase else 15

        # Lunar strength: peaks at full moon (tithi 15), weakest at new moon (tithi 30)
        if tithi <= 15:
            moon_strength = (tithi - 1) / 14.0       # 0.0..1.0 over shukla
        else:
            moon_strength = 1.0 - (tithi - 15) / 14.0  # 1.0..0.0 over krishna
        moon_strength = moon_strength * 1.6 - 0.3    # scale to -0.3..+1.3

        # Nakshatra quality — independent additive factor
        nk_nature = _NAKSHATRA_NATURE.get(moon_tp["nakshatra"], 0.0)

        # Moon BAV in transiting house — measures how well-supported the transit is
        moon_av = next((av for av in transit_avarga if av["planet"] == "moon"), None)
        bav = moon_av["bav"] if moon_av and moon_av["bav"] is not None else 4
        bav_mod = (bav - 4) / 4.0    # -1.0..+1.0

        # Dignity: exalted/own boosts strength, debilitated cuts it
        dignity = moon_tp["dignity"]
        dignity_bonus = {"exalted": +1.5, "own_sign": +0.8,
                         "neutral": 0.0,  "debilitated": -1.5}.get(dignity, 0.0)

        # House: additive — 9/10/11 good, 8/12 bad, regardless of planet sign
        house_bonus = _HOUSE_MOD.get(moon_tp["house"], 0.0) * 4.0

        # Tithi quality — additive, independent of moon strength
        tithi_bonus = _TITHI_MOD.get(tithi, 0.0) * 5.0

        moon_score = (moon_strength * 12.0
                      + nk_nature * 8.0
                      + bav_mod * 5.0
                      + dignity_bonus * 3.0
                      + house_bonus
                      + tithi_bonus)
        score += moon_score

    # ── B. Transit planets in natal houses ───────────────────────────────
    # Fix: use additive model — planet nature and house quality contribute
    # independently, avoiding sign-flip bug (malefic in bad house ≠ positive).
    for tp in transit_planets:
        pk = tp["planet"]
        if pk == "moon":
            continue
        nature = _PLANET_NATURE.get(pk, 0.0)          # benefic >0, malefic <0
        house_mod = _HOUSE_MOD.get(tp["house"], 0.0)  # good house >0, bad <0
        dignity = tp["dignity"]
        dignity_bonus = {"exalted": +0.4, "own_sign": +0.2,
                         "neutral": 0.0,  "debilitated": -0.5}.get(dignity, 0.0)

        # Additive: nature tells direction, house amplifies or dampens it,
        # but cannot flip the sign of a malefic into a positive.
        # nature_contribution: malefic in bad house = extra bad, not good.
        if nature >= 0:
            # Benefic: strengthened in good houses, weakened in bad ones
            planet_contrib = nature * (1.0 + house_mod) * 2.0 + dignity_bonus * 1.5
        else:
            # Malefic: bad in bad houses, partially neutralised in good ones
            # house_mod >= 0 reduces harm; house_mod < 0 amplifies harm
            planet_contrib = nature * (1.0 - house_mod) * 2.0 + dignity_bonus * 1.5

        score += planet_contrib

    # ── C. Ashtakavarga ───────────────────────────────────────────────────
    # BAV measures how many of the 8 reference points support the transit.
    # SAV is the total across all planets in that house (28 = average).
    # We track Moon separately with higher weight as it drives daily mood.
    moon_av_counted = False
    for av in transit_avarga:
        pk = av["planet"]
        if pk == "moon" and not moon_av_counted:
            moon_av_counted = True
            if av["bav"] is not None:
                score += (av["bav"] - 4) * 1.8  # already partly in moon block, halve
        elif pk != "moon":
            if av["bav"] is not None:
                score += (av["bav"] - 4) * 0.6
        # SAV: every planet contributes its house total
        score += (av["sav"] - 28) * 0.15

    # ── D. Transit aspects to natal planets ──────────────────────────────
    # Conjunction sign depends on which planet is transiting to which natal.
    # Fix: use transit planet nature as the primary driver, aspect as modifier.
    for asp in transit_aspects:
        if asp.get("aspect") == "jyotish_aspect":
            continue
        tr_pk  = asp["transit_planet"]
        nat_pk = asp["natal_planet"]
        aspect = asp["aspect"]
        orb    = asp.get("orb", 5.0)

        tr_nature  = _PLANET_NATURE.get(tr_pk, 0.0)
        nat_nature = _PLANET_NATURE.get(nat_pk, 0.0)

        # Aspect quality: trine/sextile amplify benefic & reduce malefic harm;
        # square/opposition do the opposite.
        asp_factor = _ASPECT_QUALITY.get(aspect, 0.0)  # trine=+1, square=-0.8 etc.

        if aspect == "conjunction":
            # Conjunction: energies blend — benefic+benefic great, malefic+malefic bad
            combined_nature = (tr_nature + nat_nature) / 2.0
            contribution = combined_nature * 2.0
        else:
            # Transit planet brings its nature; aspect quality shapes delivery
            # Benefic planet in trine: positive. Malefic in trine: less harm.
            # Benefic in square: benefit blocked. Malefic in square: extra harm.
            if tr_nature >= 0:
                contribution = tr_nature * (1.0 + asp_factor) * 1.5
            else:
                contribution = tr_nature * (1.0 - asp_factor) * 1.5

        # Orb: tighter = stronger (linear decay, min 20% at 10°)
        orb_factor = max(0.2, 1.0 - orb / 10.0)
        score += contribution * orb_factor

    # ── E. Dasha lords ────────────────────────────────────────────────────
    # Nature of the dasha lord is only half the story — equally important is
    # which natal houses it rules (functional nature by lagna).
    # Kendra (1,4,7,10) + trikona (1,5,9): lords are functional benefics.
    # Dusthana (6,8,12): lords are functional malefics.
    # Upachaya (3,6,10,11): neutral/positive for malefics, mixed for benefics.
    _KENDRA   = {1, 4, 7, 10}
    _TRIKONA  = {1, 5, 9}
    _DUSTHANA = {6, 8, 12}

    def _dasha_house_mod(planet_key: str) -> float:
        """Return a house-rulership modifier for this dasha lord."""
        if not planet_key or not natal_chart:
            return 0.0
        np = natal_chart.planets.get(planet_key)
        if np is None:
            return 0.0
        ruled = getattr(np, "ruler_of_houses", [])
        mod = 0.0
        for h in ruled:
            if h in _KENDRA or h in _TRIKONA:
                mod += 0.6    # rules an auspicious house
            if h in _DUSTHANA:
                mod -= 0.8    # rules a difficult house
        return mod

    maha  = active_dasha["mahadasha"].lower()
    antar = (active_dasha["antardasha"] or "").lower()
    pratya = (active_dasha.get("pratyantardasha") or "").lower()

    maha_n   = _PLANET_NATURE.get(maha, 0.0)  + _dasha_house_mod(maha)
    antar_n  = _PLANET_NATURE.get(antar, 0.0) + _dasha_house_mod(antar)
    pratya_n = _PLANET_NATURE.get(pratya, 0.0) + _dasha_house_mod(pratya)

    score += maha_n * 4.0 + antar_n * 5.0 + pratya_n * 3.0

    return max(5, min(95, round(score)))


# ── Tips builder ─────────────────────────────────────────────────────────

def _build_tips(
    transit_planets, transit_aspects, active_dasha,
    transit_avarga, score: int, language: str,
    lunar_phase: Optional[dict] = None,
    natal_chart=None,
) -> list[dict]:
    tips: list[dict] = []

    names_ru = {"sun":"Солнце","moon":"Луна","mars":"Марс","mercury":"Меркурий",
                "jupiter":"Юпитер","venus":"Венера","saturn":"Сатурн",
                "rahu":"Раху","ketu":"Кету"}

    def _tip(type_, icon, text_ru, text_en):
        return {"type": type_, "icon": icon, "text_ru": text_ru, "text_en": text_en}

    # ── Lunar phase tip ───────────────────────────────────────────────────
    moon_tp = next((tp for tp in transit_planets if tp["planet"] == "moon"), None)
    if lunar_phase and moon_tp:
        tithi = lunar_phase["tithi"]
        paksha = lunar_phase["paksha"]
        phase_ru = lunar_phase["phase_name_ru"]
        phase_en = lunar_phase["phase_name_en"]
        nk = moon_tp["nakshatra"]
        pada = moon_tp["pada"]
        illum = lunar_phase["illumination_pct"]

        if tithi == 30:
            tips.append(_tip("caution", "🌑",
                f"Новолуние — Луна почти невидима ({illum}% освещённости). День хорош для отдыха и размышлений, но не для старта важных дел.",
                f"New Moon — the Moon is nearly invisible ({illum}% illumination). Good for rest and reflection, not for launching important endeavors.",
            ))
        elif tithi == 15:
            tips.append(_tip("good", "🌕",
                f"Полнолуние — Луна полностью освещена ({illum}%). Эмоции и энергия на пике, день насыщенный и интенсивный.",
                f"Full Moon — the Moon is fully illuminated ({illum}%). Emotions and energy are at their peak — an intense and vibrant day.",
            ))
        else:
            moon_dir = "растёт" if paksha == "shukla" else "убывает"
            moon_dir_en = "waxing" if paksha == "shukla" else "waning"
            tips.append(_tip("info", "☽",
                f"Луна {moon_dir} ({illum}% освещённости). День {tithi} лунного месяца.",
                f"Moon is {moon_dir_en} ({illum}% illumination). Day {tithi} of the lunar month.",
            ))

        # Warn on inauspicious tithis
        if tithi in (4, 6, 8, 9, 14, 19, 21, 29, 30):
            tips.append(_tip("caution", "◑",
                "Луна в напряжённой фазе — лучше избегать важных решений и новых начинаний сегодня.",
                "The Moon is in a tense phase — better to avoid major decisions and new beginnings today.",
            ))

    # ── Retrograde planets ────────────────────────────────────────────────
    retro = [tp["planet"] for tp in transit_planets if tp["retrograde"]]
    if retro:
        pl_ru = ", ".join(names_ru.get(p, p) for p in retro)
        pl_en = ", ".join(p.capitalize() for p in retro)
        tips.append(_tip("warning", "℞",
            f"{pl_ru} движется назад (ретроградность) — не лучшее время для новых договоров и решений в сферах этой планеты. Хорошо для переосмысления и завершения старого.",
            f"{pl_en} is retrograde — not the best time for new contracts or decisions in that planet's domain. Good for revisiting and completing unfinished matters.",
        ))

    # ── Debilitated transiting planets ───────────────────────────────────
    debil = [tp for tp in transit_planets if tp["dignity"] == "debilitated"
             and tp["planet"] in ("sun","moon","mars","jupiter","venus","saturn")]
    for tp in debil:
        pk = tp["planet"]
        ru_name = names_ru.get(pk, pk.capitalize())
        tips.append(_tip("caution", "⚠",
            f"{ru_name} сейчас в ослабленном состоянии — энергия этой планеты снижена. Будьте внимательны в её сферах влияния.",
            f"{pk.capitalize()} is currently weakened — its energy is diminished. Be mindful in areas it governs.",
        ))

    # ── Exalted transiting planets ────────────────────────────────────────
    exalt = [tp for tp in transit_planets if tp["dignity"] == "exalted"
             and tp["planet"] in ("sun","moon","mars","jupiter","venus","saturn")]
    for tp in exalt[:2]:
        pk = tp["planet"]
        ru_name = names_ru.get(pk, pk.capitalize())
        tips.append(_tip("good", "✦",
            f"{ru_name} сейчас в наилучшем положении — её влияние максимально усилено.",
            f"{pk.capitalize()} is currently at its strongest — its influence is greatly enhanced.",
        ))

    # ── Low SAV warning for Moon's house ─────────────────────────────────
    if moon_tp:
        moon_av = next((av for av in transit_avarga if av["planet"] == "moon"), None)
        if moon_av and moon_av["sav"] is not None and moon_av["sav"] < 25:
            tips.append(_tip("caution", "◑",
                "Луна проходит через слабо поддержанную зону — эмоциональная чуткость и восприимчивость сегодня повышены.",
                "The Moon passes through a weakly supported zone — emotional sensitivity is heightened today.",
            ))

    # ── Strong benefic transits ───────────────────────────────────────────
    for pk in ("jupiter", "venus"):
        tp = next((t for t in transit_planets if t["planet"] == pk), None)
        if tp and tp["house"] in {3, 6, 10, 11} and tp["dignity"] in ("exalted", "own_sign", "neutral"):
            av = next((av for av in transit_avarga if av["planet"] == pk), None)
            if av and av.get("bav") and av["bav"] >= 5:
                ru_name = "Юпитер" if pk == "jupiter" else "Венера"
                area_ru = "расширяет возможности и приносит удачу" if pk == "jupiter" else "усиливает гармонию и привлекательность"
                area_en = "expands opportunities and brings luck" if pk == "jupiter" else "enhances harmony and attractiveness"
                tips.append(_tip("good",
                    "♃" if pk == "jupiter" else "♀",
                    f"{ru_name} сейчас в сильной позиции — {area_ru}.",
                    f"{'Jupiter' if pk == 'jupiter' else 'Venus'} is in a strong position — {area_en}.",
                ))

    # ── Pratyantar dasha tip ──────────────────────────────────────────────
    pratya = active_dasha.get("pratyantardasha")
    if pratya:
        pratya_nature = _PLANET_NATURE.get(pratya.lower(), 0.0)
        if pratya_nature >= 0.8:
            tips.append(_tip("good", "◎",
                f"Текущий мини-период ({pratya}) усиливает позитивный фон — хорошее время для активных действий.",
                f"The current mini-period ({pratya}) amplifies the positive backdrop — a good time for active steps.",
            ))
        elif pratya_nature <= -0.6:
            tips.append(_tip("caution", "◎",
                f"Текущий мини-период ({pratya}) добавляет некоторую напряжённость. Требуется терпение и внимательность.",
                f"The current mini-period ({pratya}) adds some tension. Patience and attentiveness are needed.",
            ))

    # ── Antardasha ending soon ────────────────────────────────────────────
    remaining = active_dasha.get("antardasha_remaining_days")
    antar = active_dasha["antardasha"]
    if remaining is not None and remaining <= 14:
        tips.append(_tip("info", "◑",
            f"Подпериод {antar} завершается через {int(remaining)} дн. — переходное время, скоро начнётся новый цикл.",
            f"The sub-period of {antar} ends in {int(remaining)} days — a transitional time, a new cycle is coming.",
        ))

    # ── Персональные советы по натальной карте ────────────────────────────
    if natal_chart:
        _build_personal_tips(tips, _tip, transit_planets, transit_aspects,
                             transit_avarga, natal_chart, names_ru)

    return tips


# ── House meanings ────────────────────────────────────────────────────────────

_HOUSE_MEANING_RU = {
    1:  ("личность и здоровье", "ты сам, твоё тело и внешний вид"),
    2:  ("финансы и ресурсы", "деньги, имущество, семья и речь"),
    3:  ("коммуникации и усилия", "братья/сёстры, поездки, смелость и навыки"),
    4:  ("дом и душевный покой", "жильё, мать, эмоциональная основа"),
    5:  ("творчество и дети", "творчество, романтика, дети и интеллект"),
    6:  ("работа и здоровье", "повседневная работа, здоровье, конкуренты"),
    7:  ("партнёрство и отношения", "брак, деловые партнёры, открытые противники"),
    8:  ("трансформация и тайное", "кризисы, наследство, скрытые силы"),
    9:  ("удача и мировоззрение", "удача, высшее образование, духовность и путешествия"),
    10: ("карьера и статус", "профессия, репутация и общественное положение"),
    11: ("доходы и друзья", "прибыль, мечты, социальные связи"),
    12: ("уединение и потери", "расходы, уединение, иностранные страны и духовный рост"),
}
_HOUSE_MEANING_EN = {
    1:  ("identity and health", "yourself, your body and appearance"),
    2:  ("finances and resources", "money, possessions, family and speech"),
    3:  ("communication and effort", "siblings, short trips, courage and skills"),
    4:  ("home and peace of mind", "home, mother, emotional foundation"),
    5:  ("creativity and children", "creativity, romance, children and intellect"),
    6:  ("work and health", "daily work, health, competition"),
    7:  ("partnerships and relationships", "marriage, business partners, open rivals"),
    8:  ("transformation and secrets", "crises, inheritance, hidden forces"),
    9:  ("luck and philosophy", "fortune, higher education, spirituality and travel"),
    10: ("career and status", "profession, reputation and social standing"),
    11: ("income and friends", "gains, wishes, social networks"),
    12: ("solitude and losses", "expenses, isolation, foreign lands and spiritual growth"),
}

# Планеты, чей транзит по домам даёт значимые события
_SLOW_PLANETS = {"saturn", "jupiter", "rahu", "ketu", "mars"}
# Быстрые (Солнце, Меркурий, Венера) — комментируем только при особых аспектах

_ASPECT_LABEL_RU = {
    "conjunction": "соединяется",
    "trine":       "в гармонии",
    "sextile":     "поддерживает",
    "square":      "создаёт напряжение",
    "opposition":  "противостоит",
}
_ASPECT_LABEL_EN = {
    "conjunction": "joins",
    "trine":       "harmonizes with",
    "sextile":     "supports",
    "square":      "challenges",
    "opposition":  "opposes",
}

_PLANET_QUALITY_RU = {
    "sun":     "энергия воли и самовыражения",
    "moon":    "эмоциональная сфера",
    "mars":    "энергия действия и конфликтов",
    "mercury": "мышление и коммуникации",
    "jupiter": "мудрость, рост и удача",
    "venus":   "гармония, красота и отношения",
    "saturn":  "дисциплина, ограничения и труд",
    "rahu":    "нестандартные пути и амбиции",
    "ketu":    "отпускание и духовный поиск",
}
_PLANET_QUALITY_EN = {
    "sun":     "will and self-expression",
    "moon":    "emotional sphere",
    "mars":    "action and conflict energy",
    "mercury": "thinking and communication",
    "jupiter": "wisdom, growth and luck",
    "venus":   "harmony, beauty and relationships",
    "saturn":  "discipline, limitations and hard work",
    "rahu":    "unconventional paths and ambitions",
    "ketu":    "letting go and spiritual seeking",
}


def _build_personal_tips(tips, _tip, transit_planets, transit_aspects,
                          transit_avarga, natal_chart, names_ru) -> None:
    """Add personalized tips based on natal chart houses, lords, and aspects."""

    natal_planets = natal_chart.planets   # dict[str, PlanetData]
    natal_houses  = natal_chart.houses    # dict[str, HouseData]  keys "1".."12"

    names_en = {k: k.capitalize() for k in names_ru}

    # ── A. Slow planets transiting key natal houses ───────────────────────
    for tp in transit_planets:
        pk = tp["planet"]
        if pk not in _SLOW_PLANETS:
            continue
        house = tp["house"]
        if house not in _HOUSE_MEANING_RU:
            continue

        ru_name = names_ru.get(pk, pk)
        en_name = names_en.get(pk, pk)
        short_ru, detail_ru = _HOUSE_MEANING_RU[house]
        short_en, detail_en = _HOUSE_MEANING_EN[house]

        # Check if any natal planet lives in this house — makes it more personal
        occupants = [
            names_ru.get(p_key, p_key)
            for p_key, p_data in natal_planets.items()
            if getattr(p_data, "house", None) == house
        ]
        occupants_en = [
            names_en.get(p_key, p_key)
            for p_key, p_data in natal_planets.items()
            if getattr(p_data, "house", None) == house
        ]

        dignity = tp["dignity"]
        retrograde = tp["retrograde"]

        # Tone: benefic (jupiter/venus) vs malefic (saturn/mars/rahu/ketu)
        is_benefic = pk in ("jupiter", "venus")
        is_malefic = pk in ("saturn", "mars", "rahu", "ketu")

        retro_note_ru = " (движется назад — эффект внутренний, замедленный)" if retrograde else ""
        retro_note_en = " (retrograde — the effect is internal and delayed)" if retrograde else ""

        if dignity == "debilitated":
            strength_ru = "в ослабленном состоянии"
            strength_en = "in a weakened state"
        elif dignity in ("exalted", "own_sign"):
            strength_ru = "в сильном положении"
            strength_en = "in a strong position"
        else:
            strength_ru = ""
            strength_en = ""

        occ_note_ru = f" В этом доме натально стоит {', '.join(occupants)} — тема особенно активна." if occupants else ""
        occ_note_en = f" Natal {', '.join(occupants_en)} resides here — this theme is especially active." if occupants_en else ""

        if is_benefic and not retrograde:
            tip_type = "good"
            icon = "♃" if pk == "jupiter" else "♀"
            text_ru = (f"{ru_name}{' ' + strength_ru if strength_ru else ''} проходит через твой {house}-й дом "
                       f"({short_ru}).{occ_note_ru} Это поддерживает {detail_ru}.")
            text_en = (f"{en_name}{' ' + strength_en if strength_en else ''} transits your {house}th house "
                       f"({short_en}).{occ_note_en} This supports {detail_en}.")
        elif is_malefic and dignity == "debilitated":
            tip_type = "warning"
            icon = "⚠"
            text_ru = (f"{ru_name} в ослабленном состоянии проходит через твой {house}-й дом "
                       f"({short_ru}).{occ_note_ru}{retro_note_ru} Возможны трудности в теме {detail_ru}.")
            text_en = (f"{en_name} weakened, transiting your {house}th house "
                       f"({short_en}).{occ_note_en}{retro_note_en} Possible difficulties in {detail_en}.")
        elif is_malefic:
            tip_type = "caution"
            icon = "◑"
            strength_str_ru = f" ({strength_ru})" if strength_ru else ""
            strength_str_en = f" ({strength_en})" if strength_en else ""
            text_ru = (f"{ru_name}{strength_str_ru} проходит через твой {house}-й дом "
                       f"({short_ru}).{occ_note_ru}{retro_note_ru} Требует внимания сфера: {detail_ru}.")
            text_en = (f"{en_name}{strength_str_en} transits your {house}th house "
                       f"({short_en}).{occ_note_en}{retro_note_en} Pay attention to: {detail_en}.")
        else:
            continue  # быстрые нейтральные — пропускаем

        tips.append(_tip(tip_type, icon, text_ru, text_en))

    # ── B. Transit aspects to natal planets (tight orb ≤ 4°) ─────────────
    for asp in transit_aspects:
        if asp.get("aspect") == "jyotish_aspect":
            continue
        orb = asp.get("orb", 99)
        if orb > 4:
            continue  # только точные аспекты

        tr_pk  = asp["transit_planet"]
        nat_pk = asp["natal_planet"]
        aspect = asp["aspect"]

        tr_name_ru  = names_ru.get(tr_pk, tr_pk)
        nat_name_ru = names_ru.get(nat_pk, nat_pk)
        tr_name_en  = tr_pk.capitalize()
        nat_name_en = nat_pk.capitalize()

        label_ru = _ASPECT_LABEL_RU.get(aspect, aspect)
        label_en = _ASPECT_LABEL_EN.get(aspect, aspect)
        tr_quality_ru = _PLANET_QUALITY_RU.get(tr_pk, "")
        nat_quality_ru = _PLANET_QUALITY_RU.get(nat_pk, "")
        tr_quality_en  = _PLANET_QUALITY_EN.get(tr_pk, "")
        nat_quality_en = _PLANET_QUALITY_EN.get(nat_pk, "")

        nat_p = natal_planets.get(nat_pk)
        nat_house = getattr(nat_p, "house", None)
        nat_house_str_ru = f" (твой {nat_house}-й дом — {_HOUSE_MEANING_RU[nat_house][0]})" if nat_house and nat_house in _HOUSE_MEANING_RU else ""
        nat_house_str_en = f" (your {nat_house}th house — {_HOUSE_MEANING_EN[nat_house][0]})" if nat_house and nat_house in _HOUSE_MEANING_EN else ""

        is_harmonious = aspect in ("trine", "sextile")
        is_tense = aspect in ("square", "opposition")
        tr_is_benefic = tr_pk in ("jupiter", "venus")
        tr_is_malefic = tr_pk in ("saturn", "mars", "rahu", "ketu")

        if is_harmonious and tr_is_benefic:
            tip_type = "good"
            icon = "✦"
        elif is_tense and tr_is_malefic:
            tip_type = "warning"
            icon = "⚠"
        elif is_harmonious:
            tip_type = "good"
            icon = "✦"
        elif is_tense:
            tip_type = "caution"
            icon = "◑"
        elif aspect == "conjunction":
            tip_type = "caution" if tr_is_malefic else "good"
            icon = "◎"
        else:
            continue

        text_ru = (f"Транзитный {tr_name_ru} {label_ru} с твоим натальным {nat_name_ru}"
                   f"{nat_house_str_ru} (орб {orb:.1f}°). "
                   f"{tr_name_ru} несёт {tr_quality_ru}, затрагивая {nat_quality_ru}.")
        text_en = (f"Transit {tr_name_en} {label_en} your natal {nat_name_en}"
                   f"{nat_house_str_en} (orb {orb:.1f}°). "
                   f"{tr_name_en} brings {tr_quality_en}, touching {nat_quality_en}.")

        tips.append(_tip(tip_type, icon, text_ru, text_en))

    # ── C. Transiting house lord в плохом положении ───────────────────────
    # Если владелец важного дома (2, 7, 10, 11) сейчас в плохом состоянии — предупреждаем
    key_houses = {2, 7, 10, 11}
    for h_str, h_data in natal_houses.items():
        h_num = int(h_str)
        if h_num not in key_houses:
            continue
        lord_name = getattr(h_data, "lord", None)
        if not lord_name:
            continue
        lord_key = lord_name.lower()
        tr_lord = next((t for t in transit_planets if t["planet"] == lord_key), None)
        if not tr_lord:
            continue
        if tr_lord["dignity"] == "debilitated" and not tr_lord["retrograde"]:
            short_ru, _ = _HOUSE_MEANING_RU[h_num]
            short_en, _ = _HOUSE_MEANING_EN[h_num]
            lord_ru = names_ru.get(lord_key, lord_name)
            tips.append(_tip("caution", "⚠",
                f"Управитель твоего {h_num}-го дома ({short_ru}) — {lord_ru} — сейчас ослаблен. "
                f"Будь внимателен в вопросах {short_ru}.",
                f"The ruler of your {h_num}th house ({short_en}) — {lord_name} — is currently weakened. "
                f"Be careful with matters of {short_en}.",
            ))


# ── Daily indicators ─────────────────────────────────────────────────────────

# Nakshatra quality for haircut (traditional Vedic rules):
# Good: Rohini, Mrigashira, Punarvasu, Hasta, Chitra, Swati, Anuradha, Revati,
#        Ashwini, Pushya, Shravana, Uttara Phalguni, Uttara Ashadha, Uttara Bhadrapada
# Avoid: Bharani, Krittika, Ardra, Ashlesha, Magha, Vishakha, Jyeshtha,
#         Mula, Purva Phalguni, Purva Ashadha, Purva Bhadrapada, Shatabhisha, Dhanishtha
_HAIRCUT_NK_GOOD = {
    "Rohini", "Mrigashira", "Punarvasu", "Hasta", "Chitra",
    "Swati", "Anuradha", "Revati", "Ashwini", "Pushya",
    "Shravana", "Uttara Phalguni", "Uttara Ashadha", "Uttara Bhadrapada",
}
_HAIRCUT_NK_BAD = {
    "Bharani", "Krittika", "Ardra", "Ashlesha", "Magha",
    "Vishakha", "Jyeshtha", "Mula", "Purva Phalguni",
    "Purva Ashadha", "Purva Bhadrapada", "Shatabhisha", "Dhanishtha",
}
# Tithis to avoid for haircut (4, 9, 14, 30)
_HAIRCUT_TITHI_BAD = {4, 9, 14, 30}

# Nakshatra quality for financial activity / deals
_FINANCE_NK_GOOD = {
    "Rohini", "Uttara Phalguni", "Uttara Ashadha", "Uttara Bhadrapada",
    "Pushya", "Hasta", "Anuradha", "Revati", "Shravana",
}

# Nakshatra quality for starting new ventures / important decisions
_NEW_START_NK_GOOD = {
    "Ashwini", "Rohini", "Mrigashira", "Punarvasu", "Pushya",
    "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Anuradha",
    "Shravana", "Uttara Ashadha", "Revati",
}
_NEW_START_NK_BAD = {"Ardra", "Ashlesha", "Jyeshtha", "Mula", "Bharani", "Krittika"}


def _build_indicators(
    transit_planets: list[dict],
    lunar_phase: Optional[dict],
) -> list[dict]:
    """
    Compute named activity indicators based on lunar position, nakshatra, tithi.
    Returns list of dicts: {id, label_ru, label_en, rating, reason_ru, reason_en}
    rating: "good" | "neutral" | "bad"
    """
    indicators = []

    moon_tp = next((t for t in transit_planets if t["planet"] == "moon"), None)
    if not lunar_phase or not moon_tp:
        return indicators

    tithi = lunar_phase["tithi"]
    paksha = lunar_phase["paksha"]
    nk = moon_tp["nakshatra"]
    pada = moon_tp["pada"]

    # ── 1. Haircut indicator ─────────────────────────────────────────────────
    haircut_bad_tithi = tithi in _HAIRCUT_TITHI_BAD
    haircut_bad_nk = nk in _HAIRCUT_NK_BAD
    haircut_good_nk = nk in _HAIRCUT_NK_GOOD
    moon_phase_label_ru = "растущая Луна" if paksha == "shukla" else "убывающая Луна"
    moon_phase_label_en = "waxing Moon" if paksha == "shukla" else "waning Moon"
    if tithi == 30:
        haircut_rating = "bad"
        haircut_ru = "Новолуние — худший день для стрижки. Волосы будут расти медленно, возможна слабость."
        haircut_en = "New Moon — worst day for a haircut. Hair grows slowly, energy is low."
    elif tithi == 14:
        haircut_rating = "bad"
        haircut_ru = "День перед новолунием — стрижку лучше отложить. Энергия Луны на минимуме."
        haircut_en = "Day before New Moon — better to postpone. Lunar energy is at its lowest."
    elif haircut_bad_nk and haircut_bad_tithi:
        haircut_rating = "bad"
        haircut_ru = f"Неблагоприятный день для стрижки: {moon_phase_label_ru} в напряжённой фазе. Лучше перенести."
        haircut_en = f"Unfavorable day for a haircut: {moon_phase_label_en} in a tense phase. Better to postpone."
    elif haircut_bad_nk:
        haircut_rating = "bad"
        haircut_ru = f"Стрижку сегодня лучше не делать — Луна в неудачном положении для волос."
        haircut_en = "Better to skip the haircut today — the Moon is in an unfavorable position for hair."
    elif haircut_bad_tithi:
        haircut_rating = "neutral"
        haircut_ru = f"День допустим для стрижки, но не идеален — {moon_phase_label_ru} в слабой фазе."
        haircut_en = f"Acceptable for a haircut, but not ideal — {moon_phase_label_en} in a weak phase."
    elif haircut_good_nk and paksha == "shukla":
        haircut_rating = "good"
        haircut_ru = "Хороший день для стрижки — растущая Луна в сильном положении. Волосы будут расти быстро и здорово."
        haircut_en = "Good day for a haircut — waxing Moon in a strong position. Hair will grow fast and healthy."
    elif haircut_good_nk:
        haircut_rating = "good"
        haircut_ru = "Подходящий день для стрижки — Луна в благоприятном положении для волос."
        haircut_en = "Good day for a haircut — the Moon is in a favorable position for hair."
    else:
        haircut_rating = "neutral"
        haircut_ru = f"Нейтральный день для стрижки — {moon_phase_label_ru}. Особых противопоказаний нет."
        haircut_en = f"Neutral day for a haircut — {moon_phase_label_en}. No particular contraindications."

    indicators.append({
        "id": "haircut",
        "label_ru": "Стрижка",
        "label_en": "Haircut",
        "icon": "✂",
        "rating": haircut_rating,
        "reason_ru": haircut_ru,
        "reason_en": haircut_en,
    })

    # ── 2. Financial activity / deals ────────────────────────────────────────
    finance_bad_tithi = tithi in {6, 8, 9, 12, 14, 30}
    fin_good_nk = nk in _FINANCE_NK_GOOD

    # Venus and Jupiter influence
    venus = next((t for t in transit_planets if t["planet"] == "venus"), None)
    jupiter = next((t for t in transit_planets if t["planet"] == "jupiter"), None)
    benefic_boost = (
        (venus and venus["dignity"] in ("exalted", "own_sign") and not venus["retrograde"]) or
        (jupiter and jupiter["dignity"] in ("exalted", "own_sign") and not jupiter["retrograde"])
    )

    if tithi == 30:
        fin_rating = "bad"
        fin_ru = "Новолуние — не лучший день для денежных дел и подписания договоров."
        fin_en = "New Moon — not a good day for financial matters or signing contracts."
    elif fin_good_nk and not finance_bad_tithi and paksha == "shukla":
        fin_rating = "good"
        extra = " Венера и Юпитер дополнительно усиливают удачу в деньгах." if benefic_boost else ""
        fin_ru = f"Благоприятный день для финансов — растущая Луна в сильном положении. Хорошо для сделок, переговоров и вложений.{extra}"
        fin_en = f"Favorable day for finances — waxing Moon in a strong position. Good for deals, negotiations, and investments.{' Venus and Jupiter add extra luck with money.' if benefic_boost else ''}"
    elif fin_good_nk and not finance_bad_tithi:
        fin_rating = "good"
        fin_ru = "Подходящий день для финансовых вопросов — Луна в благоприятном положении для денег."
        fin_en = "Suitable day for financial matters — the Moon is in a favorable position for money."
    elif finance_bad_tithi:
        fin_rating = "bad" if tithi in {6, 8, 9, 30} else "neutral"
        fin_ru = "Сегодня лучше избегать крупных финансовых решений — Луна в напряжённой фазе."
        fin_en = "Better to avoid major financial decisions today — the Moon is in a tense phase."
    else:
        fin_rating = "neutral"
        fin_ru = "Нейтральный день для финансов. Текущие дела вести можно, крупных решений лучше не принимать."
        fin_en = "Neutral day for finances. Routine matters are fine; avoid major decisions."

    indicators.append({
        "id": "finance",
        "label_ru": "Финансы",
        "label_en": "Finance",
        "icon": "$",
        "rating": fin_rating,
        "reason_ru": fin_ru,
        "reason_en": fin_en,
    })

    # ── 3. Starting new ventures / important decisions ───────────────────────
    new_bad_tithi = tithi in {4, 6, 8, 9, 14, 19, 21, 29, 30}
    new_good_nk = nk in _NEW_START_NK_GOOD
    new_bad_nk = nk in _NEW_START_NK_BAD

    if new_bad_nk and new_bad_tithi:
        start_rating = "bad"
        start_ru = "Неудачный день для новых начинаний — Луна в слабом положении. Лучше отложить важные дела."
        start_en = "Unfavorable day for new ventures — the Moon is in a weak position. Better to postpone important matters."
    elif new_bad_nk:
        start_rating = "bad"
        start_ru = "Луна сегодня не поддерживает новые начинания. Лучше завершать старое, а не начинать новое."
        start_en = "The Moon today doesn't support new ventures. Better to finish existing matters than start new ones."
    elif new_bad_tithi:
        start_rating = "bad" if tithi in {9, 14, 29, 30} else "neutral"
        start_ru = "День не лучший для старта — Луна в напряжённой фазе. Подождите пару дней."
        start_en = "Not the best day to start — the Moon is in a tense phase. Wait a couple of days."
    elif new_good_nk and paksha == "shukla":
        start_rating = "good"
        start_ru = "Отличный день для новых дел — растущая Луна в сильном положении. Начинания, стартованные сегодня, имеют хорошую поддержку."
        start_en = "Excellent day for new ventures — waxing Moon in a strong position. New beginnings today have good support."
    elif new_good_nk:
        start_rating = "good"
        start_ru = "Хороший день для важных начинаний — Луна в благоприятном положении."
        start_en = "Good day for important new ventures — the Moon is in a favorable position."
    else:
        start_rating = "neutral"
        start_ru = "Нейтральный день. Начинать новое можно, но звёзды не оказывают особой поддержки."
        start_en = "Neutral day. Starting something new is fine, but there's no special cosmic support."

    indicators.append({
        "id": "new_venture",
        "label_ru": "Новые дела",
        "label_en": "New ventures",
        "icon": "★",
        "rating": start_rating,
        "reason_ru": start_ru,
        "reason_en": start_en,
    })

    # ── 4. Travel ────────────────────────────────────────────────────────────
    travel_good_nk = {"Ashwini", "Punarvasu", "Pushya", "Hasta", "Anuradha",
                      "Shravana", "Revati", "Mrigashira", "Swati"}
    travel_bad_nk = {"Ardra", "Ashlesha", "Jyeshtha", "Mula", "Bharani",
                     "Shatabhisha", "Dhanishtha"}
    travel_bad_tithi = tithi in {4, 8, 9, 12, 14, 30}

    saturn = next((t for t in transit_planets if t["planet"] == "saturn"), None)
    saturn_bad = saturn and saturn["house"] in {1, 4, 7, 8, 12} and not saturn["retrograde"]

    if nk in travel_bad_nk and travel_bad_tithi:
        travel_rating = "bad"
        travel_ru = "Неудачный день для поездок — Луна в слабом положении. Возможны задержки и неожиданные проблемы в дороге."
        travel_en = "Unfavorable day for travel — the Moon is in a weak position. Expect possible delays and unexpected issues on the road."
    elif nk in travel_bad_nk:
        travel_rating = "bad"
        travel_ru = "Луна сегодня не благоприятствует поездкам. Если можно — перенесите путешествие."
        travel_en = "The Moon doesn't favor travel today. Postpone the trip if possible."
    elif nk in travel_good_nk and not travel_bad_tithi:
        travel_rating = "good"
        extra = " Сатурн немного осложняет маршрут — закладывайте запас времени." if saturn_bad else ""
        travel_ru = f"Хороший день для поездок — Луна поддерживает путешествия.{extra}"
        travel_en = f"Good day for travel — the Moon supports journeys.{' Saturn adds some friction — allow extra time.' if saturn_bad else ''}"
    elif travel_bad_tithi:
        travel_rating = "neutral"
        travel_ru = "День допустим для поездок, но Луна немного напряжена. Будьте внимательны в дороге."
        travel_en = "Acceptable for travel, but the Moon is slightly tense. Stay attentive on the road."
    else:
        travel_rating = "neutral"
        travel_ru = "Нейтральный день для поездок. Особых помех нет, но и особой поддержки тоже."
        travel_en = "Neutral day for travel. No major obstacles, but no special cosmic support either."

    indicators.append({
        "id": "travel",
        "label_ru": "Путешествия",
        "label_en": "Travel",
        "icon": "✈",
        "rating": travel_rating,
        "reason_ru": travel_ru,
        "reason_en": travel_en,
    })

    return indicators
