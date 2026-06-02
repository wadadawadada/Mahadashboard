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
    d = deg_diff % 360
    if d > 180:
        d = 360 - d
    if d <= 8:
        return "conjunction"
    if abs(d - 60) <= 6:
        return "sextile"
    if abs(d - 90) <= 7:
        return "square"
    if abs(d - 120) <= 7:
        return "trine"
    if abs(d - 180) <= 8:
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

    # ── 2b. Lunar phase ──────────────────────────────────────────────────
    moon_tp = next((t for t in transit_planets if t["planet"] == "moon"), None)
    sun_tp  = next((t for t in transit_planets if t["planet"] == "sun"), None)
    lunar_phase: Optional[dict] = None
    if moon_tp and sun_tp:
        lunar_phase = _calc_lunar_phase(
            moon_tp["longitude_sidereal"],
            sun_tp["longitude_sidereal"],
        )

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
                       transit_avarga, score, language, lunar_phase)

    return {
        "date": forecast_date.isoformat(),
        "language": language,
        "score": score,
        "active_dasha": active_dasha,
        "lunar_phase": lunar_phase,
        "transit_planets": transit_planets,
        "transit_aspects": transit_aspects,
        "transit_avarga": transit_avarga,
        "sav": sav,
        "bav": bav,
        "interp_keys": unique_keys,
        "tips": tips,
    }


# ── Score calculation ─────────────────────────────────────────────────────

def _calculate_daily_score(
    transit_planets, transit_aspects, active_dasha,
    transit_avarga, natal_chart, lunar_phase: Optional[dict],
) -> int:
    score = 50.0

    # ── A. Moon — primary daily driver ───────────────────────────────────
    moon_tp = next((t for t in transit_planets if t["planet"] == "moon"), None)
    if moon_tp:
        # Phase: waxing (+) / waning (-)
        tithi = lunar_phase["tithi"] if lunar_phase else 15
        # Moon nature: +1.0 on full moon, 0 at new moon, proportional in between
        if tithi <= 15:
            moon_nature = (tithi - 1) / 14.0  # 0.0 → 1.0 over shukla paksha
        else:
            moon_nature = 1.0 - (tithi - 15) / 14.0  # 1.0 → 0.0 over krishna paksha
        moon_nature = moon_nature * 1.6 - 0.3  # scale to -0.3 … +1.3

        # Moon nakshatra quality
        nk_nature = _NAKSHATRA_NATURE.get(moon_tp["nakshatra"], 0.0)

        # Moon house BAV
        moon_av = next((av for av in transit_avarga if av["planet"] == "moon"), None)
        bav = moon_av["bav"] if moon_av and moon_av["bav"] is not None else 4
        bav_mod = (bav - 4) / 4.0  # -1.0 … +1.0

        # Moon dignity
        dig_mod = _DIGNITY_MOD.get(moon_tp["dignity"], 1.0)

        # Moon house
        house_mod = _HOUSE_MOD.get(moon_tp["house"], 0.0)

        # Combined moon contribution — heavily weighted
        moon_score = (moon_nature * 12.0
                      + nk_nature * 8.0
                      + bav_mod * 5.0
                      + house_mod * 4.0
                      + (dig_mod - 1.0) * 3.0)
        score += moon_score

        # Tithi quality
        tithi_mod = _TITHI_MOD.get(tithi, 0.0)
        score += tithi_mod * 5.0

    # ── B. Slow planet house placements (excl. moon) ──────────────────────
    for tp in transit_planets:
        pk = tp["planet"]
        if pk == "moon":
            continue
        nature = _PLANET_NATURE.get(pk, 0.0)
        dignity_mod = _DIGNITY_MOD.get(tp["dignity"], 1.0)
        house_mod = _HOUSE_MOD.get(tp["house"], 0.0)
        contribution = nature * dignity_mod * house_mod * 2.5
        score += contribution

    # ── C. Ashtakavarga ───────────────────────────────────────────────────
    for av in transit_avarga:
        pk = av["planet"]
        weight = 1.8 if pk == "moon" else 0.8
        if av["bav"] is not None:
            bav_delta = (av["bav"] - 4) * weight
            score += bav_delta
        sav_delta = (av["sav"] - 28) * 0.2
        score += sav_delta

    # ── D. Transit aspects to natal planets ──────────────────────────────
    for asp in transit_aspects:
        if asp["aspect"] == "jyotish_aspect":
            continue
        tr_pk = asp["transit_planet"]
        nat_pk = asp["natal_planet"]
        tr_nature = _PLANET_NATURE.get(tr_pk, 0.0)
        nat_nature = _PLANET_NATURE.get(nat_pk, 0.0)
        asp_mod = _ASPECT_QUALITY.get(asp["aspect"], 0.0)
        if asp["aspect"] == "conjunction":
            asp_mod = (tr_nature + nat_nature) / 2.0
        # Orb tightness — closer = stronger
        orb = asp.get("orb", 5.0)
        orb_factor = max(0.2, 1.0 - orb / 10.0)
        contribution = (tr_nature + nat_nature) / 2.0 * asp_mod * orb_factor * 2.5
        score += contribution

    # ── E. Dasha lords ────────────────────────────────────────────────────
    maha = active_dasha["mahadasha"].lower()
    antar = (active_dasha["antardasha"] or "").lower()
    pratya = (active_dasha.get("pratyantardasha") or "").lower()

    maha_nature = _PLANET_NATURE.get(maha, 0.0)
    antar_nature = _PLANET_NATURE.get(antar, 0.0)
    pratya_nature = _PLANET_NATURE.get(pratya, 0.0)

    # Dasha sets the backdrop; pratyantar changes daily/weekly
    score += maha_nature * 5.0 + antar_nature * 4.0 + pratya_nature * 3.0

    return max(5, min(95, round(score)))


# ── Tips builder ─────────────────────────────────────────────────────────

def _build_tips(
    transit_planets, transit_aspects, active_dasha,
    transit_avarga, score: int, language: str,
    lunar_phase: Optional[dict] = None,
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
        phase_ru = lunar_phase["phase_name_ru"]
        phase_en = lunar_phase["phase_name_en"]
        nk = moon_tp["nakshatra"]
        pada = moon_tp["pada"]
        illum = lunar_phase["illumination_pct"]

        if tithi == 30:
            tips.append(_tip("caution", "🌑",
                f"Амавасья — Луна в новолунии ({illum}% освещённости). Благоприятно для медитации и отдыха, но не для новых начинаний.",
                f"Amavasya — New Moon ({illum}% illumination). Good for meditation and rest, avoid new ventures.",
            ))
        elif tithi == 15:
            tips.append(_tip("good", "🌕",
                f"Пурнима — Полнолуние ({illum}% освещённости). Луна в {nk} (пада {pada}) — высокая эмоциональная насыщенность дня.",
                f"Purnima — Full Moon ({illum}% illumination). Moon in {nk} (pada {pada}) — emotionally intense day.",
            ))
        else:
            tips.append(_tip("info", "☽",
                f"Луна ({phase_ru}, титхи {tithi}, {illum}%) в накшатре {nk} пада {pada}.",
                f"Moon ({phase_en}, tithi {tithi}, {illum}%) in nakshatra {nk} pada {pada}.",
            ))

        # Warn on inauspicious tithis
        if tithi in (4, 6, 8, 9, 14, 19, 21, 29, 30):
            tips.append(_tip("caution", "◑",
                f"Титхи {tithi} считается неблагоприятным для важных начинаний.",
                f"Tithi {tithi} is considered inauspicious for important new ventures.",
            ))

    # ── Retrograde planets ────────────────────────────────────────────────
    retro = [tp["planet"] for tp in transit_planets if tp["retrograde"]]
    if retro:
        pl_ru = ", ".join(names_ru.get(p, p) for p in retro)
        pl_en = ", ".join(p.capitalize() for p in retro)
        tips.append(_tip("warning", "℞",
            f"Ретроградны: {pl_ru}. Избегайте новых начинаний в их сферах.",
            f"Retrograde: {pl_en}. Avoid new beginnings in their domains.",
        ))

    # ── Debilitated transiting planets ───────────────────────────────────
    debil = [tp for tp in transit_planets if tp["dignity"] == "debilitated"
             and tp["planet"] in ("sun","moon","mars","jupiter","venus","saturn")]
    for tp in debil:
        pk = tp["planet"]
        ru_name = names_ru.get(pk, pk.capitalize())
        tips.append(_tip("caution", "⚠",
            f"{ru_name} в падении в {tp['sign']} — сниженная энергия планеты, будьте внимательны.",
            f"{pk.capitalize()} debilitated in {tp['sign']} — weakened planetary energy, be mindful.",
        ))

    # ── Exalted transiting planets ────────────────────────────────────────
    exalt = [tp for tp in transit_planets if tp["dignity"] == "exalted"
             and tp["planet"] in ("sun","moon","mars","jupiter","venus","saturn")]
    for tp in exalt[:2]:
        pk = tp["planet"]
        ru_name = names_ru.get(pk, pk.capitalize())
        tips.append(_tip("good", "✦",
            f"{ru_name} в экзальтации в {tp['sign']} — усиленное влияние планеты.",
            f"{pk.capitalize()} exalted in {tp['sign']} — strengthened planetary influence.",
        ))

    # ── Low SAV warning for Moon's house ─────────────────────────────────
    if moon_tp:
        moon_av = next((av for av in transit_avarga if av["planet"] == "moon"), None)
        if moon_av and moon_av["sav"] is not None and moon_av["sav"] < 25:
            tips.append(_tip("caution", "◑",
                "Луна транзитирует дом с низким баллом Сарваштакаварга — эмоциональная чуткость повышена.",
                "Moon transits a house with low Sarvashtakavarga score — heightened emotional sensitivity.",
            ))

    # ── Strong benefic transits ───────────────────────────────────────────
    for pk in ("jupiter", "venus"):
        tp = next((t for t in transit_planets if t["planet"] == pk), None)
        if tp and tp["house"] in {3, 6, 10, 11} and tp["dignity"] in ("exalted", "own_sign", "neutral"):
            av = next((av for av in transit_avarga if av["planet"] == pk), None)
            if av and av.get("bav") and av["bav"] >= 5:
                ru_name = "Юпитер" if pk == "jupiter" else "Венера"
                tips.append(_tip("good",
                    "♃" if pk == "jupiter" else "♀",
                    f"{ru_name} в {tp['house']}-м доме с баллом АВ {av['bav']}/8 — благоприятный транзит.",
                    f"{'Jupiter' if pk == 'jupiter' else 'Venus'} in house {tp['house']} with AV score {av['bav']}/8 — favorable transit.",
                ))

    # ── Pratyantar dasha tip ──────────────────────────────────────────────
    pratya = active_dasha.get("pratyantardasha")
    if pratya:
        pratya_nature = _PLANET_NATURE.get(pratya.lower(), 0.0)
        if pratya_nature >= 0.8:
            tips.append(_tip("good", "◎",
                f"Пратьянтардаша {pratya} — усиливает благоприятный фон периода.",
                f"Pratyantardasha {pratya} — amplifies the favorable tone of the period.",
            ))
        elif pratya_nature <= -0.6:
            tips.append(_tip("caution", "◎",
                f"Пратьянтардаша {pratya} — добавляет сложности текущему периоду. Требуется внимательность.",
                f"Pratyantardasha {pratya} — adds friction to the current period. Be attentive.",
            ))

    # ── Antardasha ending soon ────────────────────────────────────────────
    remaining = active_dasha.get("antardasha_remaining_days")
    antar = active_dasha["antardasha"]
    if remaining is not None and remaining <= 14:
        tips.append(_tip("info", "◑",
            f"Антардаша {antar} завершается через {int(remaining)} дн. — переходный период.",
            f"Antardasha {antar} ends in {int(remaining)} days — transitional period.",
        ))

    return tips
