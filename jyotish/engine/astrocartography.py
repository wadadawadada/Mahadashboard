"""
Astrocartography (ACG) — planetary angle lines on a world map.

For a given birth moment (Julian Day + natal planet tropical longitudes),
sweeps latitudes and solves for the longitude where each planet
crosses each of the 4 angles (ASC, MC, DSC, IC).

Output: GeoJSON-ready line segments + parans + zone scoring.
"""
from __future__ import annotations

import math
from typing import NamedTuple

import swisseph as swe

PLANET_IDS: dict[str, int] = {
    "sun": swe.SUN,
    "moon": swe.MOON,
    "mars": swe.MARS,
    "mercury": swe.MERCURY,
    "jupiter": swe.JUPITER,
    "venus": swe.VENUS,
    "saturn": swe.SATURN,
    "rahu": swe.MEAN_NODE,
    "ketu": swe.MEAN_NODE,  # computed as rahu + 180
}

ANGLES = ["ASC", "MC", "DSC", "IC"]

# ── Scoring weights ────────────────────────────────────────────────────────────
# Each (planet, angle) pair gets a base score: positive = beneficial, negative = challenging
# Scale: -10 … +10
SCORES: dict[tuple[str, str], float] = {
    # Jupiter — great benefic
    ("jupiter", "ASC"): 9,   ("jupiter", "MC"): 8,
    ("jupiter", "DSC"): 7,   ("jupiter", "IC"): 6,
    # Venus — benefic
    ("venus",   "ASC"): 8,   ("venus",   "MC"): 7,
    ("venus",   "DSC"): 8,   ("venus",   "IC"): 6,
    # Sun — vitality, authority
    ("sun",     "ASC"): 7,   ("sun",     "MC"): 8,
    ("sun",     "DSC"): 4,   ("sun",     "IC"): 4,
    # Moon — emotional nourishment
    ("moon",    "ASC"): 6,   ("moon",    "MC"): 5,
    ("moon",    "DSC"): 6,   ("moon",    "IC"): 7,
    # Mercury — intellect, communication
    ("mercury", "ASC"): 6,   ("mercury", "MC"): 7,
    ("mercury", "DSC"): 5,   ("mercury", "IC"): 4,
    # Mars — action, conflict
    ("mars",    "ASC"): -4,  ("mars",    "MC"): -3,
    ("mars",    "DSC"): -5,  ("mars",    "IC"): -3,
    # Saturn — restriction, hard work
    ("saturn",  "ASC"): -6,  ("saturn",  "MC"): -5,
    ("saturn",  "DSC"): -4,  ("saturn",  "IC"): -5,
    # Rahu — obsession, instability
    ("rahu",    "ASC"): -3,  ("rahu",    "MC"): -2,
    ("rahu",    "DSC"): -3,  ("rahu",    "IC"): -3,
    # Ketu — detachment, spiritual
    ("ketu",    "ASC"): -2,  ("ketu",    "MC"): -2,
    ("ketu",    "DSC"): -2,  ("ketu",    "IC"): 2,
}

# Angle descriptions RU/EN
ANGLE_DESC = {
    "ru": {
        "ASC": "Асцендент — личность, здоровье, первое впечатление",
        "MC":  "Середина Неба — карьера, репутация, статус",
        "DSC": "Десцендент — партнёрство, отношения",
        "IC":  "Надир — дом, корни, внутренний мир",
    },
    "en": {
        "ASC": "Ascendant — identity, health, first impression",
        "MC":  "Midheaven — career, reputation, status",
        "DSC": "Descendant — partnerships, relationships",
        "IC":  "Imum Coeli — home, roots, inner life",
    },
}

PLANET_DESC = {
    "ru": {
        "sun":     "Солнце",
        "moon":    "Луна",
        "mars":    "Марс",
        "mercury": "Меркурий",
        "jupiter": "Юпитер",
        "venus":   "Венера",
        "saturn":  "Сатурн",
        "rahu":    "Раху",
        "ketu":    "Кету",
    },
    "en": {
        "sun":     "Sun",
        "moon":    "Moon",
        "mars":    "Mars",
        "mercury": "Mercury",
        "jupiter": "Jupiter",
        "venus":   "Venus",
        "saturn":  "Saturn",
        "rahu":    "Rahu",
        "ketu":    "Ketu",
    },
}

PLANET_COLORS = {
    "sun":     "#f2c45b",
    "moon":    "#d8e6ff",
    "mars":    "#d66b52",
    "mercury": "#7dd2bf",
    "jupiter": "#d7b66c",
    "venus":   "#e5a0c3",
    "saturn":  "#a9a18f",
    "rahu":    "#9c7cff",
    "ketu":    "#83a2ff",
}

PLANET_GLYPHS = {
    "sun": "☉", "moon": "☽", "mars": "♂", "mercury": "☿",
    "jupiter": "♃", "venus": "♀", "saturn": "♄", "rahu": "☊", "ketu": "☋",
}

# Line style: solid = ASC/MC, dashed = DSC/IC
LINE_DASH = {"ASC": False, "MC": False, "DSC": True, "IC": True}


class NatalPositions(NamedTuple):
    jd: float                          # Julian day of birth
    tropical_lons: dict[str, float]    # tropical longitude per planet
    obliquity: float                   # ecliptic obliquity


def _get_natal_positions(jd: float) -> NatalPositions:
    """Get tropical longitudes (no ayanamsa applied) and obliquity."""
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    trop_lons: dict[str, float] = {}

    for key, pid in PLANET_IDS.items():
        if key == "ketu":
            continue
        pos, _ = swe.calc_ut(jd, pid, swe.FLG_SPEED)
        trop_lons[key] = pos[0] % 360.0

    trop_lons["ketu"] = (trop_lons["rahu"] + 180.0) % 360.0

    # Obliquity of ecliptic
    obl, _ = swe.calc_ut(jd, swe.ECL_NUT, 0)
    obliquity = obl[0]

    return NatalPositions(jd=jd, tropical_lons=trop_lons, obliquity=obliquity)


def _planet_ramc_for_angle(tropical_lon: float, obliquity_deg: float, angle: str) -> float:
    """
    Compute the RAMC (Right Ascension of MC) at which a planet
    exactly culminates on the given angle.

    For MC/IC: planet's RA directly gives RAMC.
    For ASC/DSC: solved via the standard ASC formula.

    Returns RAMC in degrees [0, 360).
    """
    obl = math.radians(obliquity_deg)
    lon = math.radians(tropical_lon)

    # Right Ascension of planet
    ra = math.degrees(math.atan2(
        math.sin(lon) * math.cos(obl),
        math.cos(lon)
    )) % 360.0

    if angle == "MC":
        return ra % 360.0
    if angle == "IC":
        return (ra + 180.0) % 360.0
    # ASC/DSC require knowing latitude — handled separately in sweep
    return ra % 360.0


def _asc_longitude_at(ramc_deg: float, lat_deg: float, obliquity_deg: float) -> float:
    """
    Compute tropical longitude of Ascendant given RAMC, geographic latitude, obliquity.
    Standard formula (Placidus/Koch derivation — same ASC regardless of house system).
    """
    ramc = math.radians(ramc_deg)
    lat  = math.radians(lat_deg)
    obl  = math.radians(obliquity_deg)

    # ASC longitude from RAMC + lat + obliquity
    x = math.cos(ramc)
    y = -(math.sin(obl) * math.tan(lat) + math.cos(obl) * math.sin(ramc))
    asc_lon = math.degrees(math.atan2(x, y)) % 360.0
    return asc_lon


def _mc_longitude_at(ramc_deg: float, obliquity_deg: float) -> float:
    """Tropical longitude of MC given RAMC and obliquity."""
    ramc = math.radians(ramc_deg)
    obl  = math.radians(obliquity_deg)
    mc = math.degrees(math.atan2(math.sin(ramc), math.cos(ramc) * math.cos(obl))) % 360.0
    return mc


def _lon_diff(a: float, b: float) -> float:
    """Signed difference b - a, wrapped to [-180, 180]."""
    d = (b - a) % 360.0
    return d - 360.0 if d > 180.0 else d


def _compute_line_for_planet_angle(
    planet_key: str,
    angle: str,
    natal: NatalPositions,
    lat_step: float = 1.0,
) -> list[list[float]]:
    """
    Sweep latitudes -75..+75 for ASC/DSC (ASC is undefined at |lat|>~66.5°),
    and -85..+85 for MC/IC.
    Returns list of [lon, lat] coordinate pairs, split into continuous segments.
    """
    obl = natal.obliquity
    planet_trop_lon = natal.tropical_lons[planet_key]
    coords: list[list[float]] = []

    if angle in ("MC", "IC"):
        mc_ramc = _planet_ramc_for_angle(planet_trop_lon, obl, "MC")
        mc_lon = _mc_longitude_at(mc_ramc, obl)
        target_lon = mc_lon if angle == "MC" else (mc_lon + 180.0) % 360.0
        geo_lon = target_lon if target_lon <= 180 else target_lon - 360.0
        for lat in _frange(-85, 85, lat_step):
            coords.append([round(geo_lon, 4), round(lat, 4)])
        return coords

    # ASC/DSC — sweep with continuity tracking
    target_lon = planet_trop_lon if angle == "ASC" else (planet_trop_lon + 180.0) % 360.0
    lat_limit = 72.0  # ASC becomes undefined/degenerate beyond arctic circles

    # prev_ramc tracks which bracket we used last, to prefer the continuous branch
    prev_ramc: float | None = None

    for lat_deg in _frange(-lat_limit, lat_limit, lat_step):
        candidates = _find_asc_brackets(target_lon, lat_deg, obl)
        if not candidates:
            prev_ramc = None
            continue

        # Choose the bracket closest to previous solution for continuity
        if prev_ramc is not None:
            def bracket_mid(br):
                return (br[0] + br[1]) / 2.0

            def ramc_dist(br):
                m = bracket_mid(br)
                d = abs(m - prev_ramc)
                return min(d, 360 - d)

            candidates.sort(key=ramc_dist)

        lo, hi = candidates[0]
        ramc_sol = _bisect_asc(target_lon, lat_deg, obl, lo, hi)
        if ramc_sol is None:
            prev_ramc = None
            continue

        prev_ramc = ramc_sol
        geo_lon = _ramc_to_geolon(ramc_sol)
        coords.append([round(geo_lon, 4), round(lat_deg, 4)])

    return coords


def _find_asc_brackets(
    target_lon: float, lat_deg: float, obl: float
) -> list[tuple[float, float]]:
    """Coarse scan to find sign-change brackets for ASC = target_lon."""
    step = 2.0 if abs(lat_deg) > 55 else 4.0
    brackets = []
    prev_diff: float | None = None
    prev_ramc: float | None = None
    for ramc_deg in _frange(0, 360 - step / 2, step):
        try:
            asc = _asc_longitude_at(ramc_deg, lat_deg, obl)
        except Exception:
            prev_diff = None
            prev_ramc = None
            continue
        diff = _lon_diff(target_lon, asc)
        if prev_diff is not None and prev_diff * diff < 0:
            brackets.append((prev_ramc, ramc_deg))
        prev_diff = diff
        prev_ramc = ramc_deg
    return brackets


def _bisect_asc(
    target_lon: float, lat_deg: float, obl: float, lo: float, hi: float
) -> float | None:
    """Refine bracket [lo, hi] to find RAMC where ASC = target_lon."""
    for _ in range(35):
        mid = (lo + hi) / 2.0
        try:
            asc = _asc_longitude_at(mid, lat_deg, obl)
        except Exception:
            return None
        diff = _lon_diff(target_lon, asc)
        if abs(diff) < 0.0002:
            return mid
        try:
            asc_lo = _asc_longitude_at(lo, lat_deg, obl)
        except Exception:
            return None
        diff_lo = _lon_diff(target_lon, asc_lo)
        if diff_lo * diff < 0:
            hi = mid
        else:
            lo = mid
    return (lo + hi) / 2.0


def _gast_degrees(jd: float) -> float:
    """Greenwich Apparent Sidereal Time in degrees."""
    # Using swisseph's sidtime function
    gast_hours = swe.sidtime(jd)
    return (gast_hours * 15.0) % 360.0


_CACHED_GAST: dict[float, float] = {}


def _ramc_to_geolon(ramc_deg: float) -> float:
    """
    Convert RAMC to geographic longitude.
    This is called after the sweep computes lines, but we need GAST.
    Since GAST is stored globally during compute_acg_lines, we use a module-level cache.
    """
    gast = _CACHED_GAST.get("current", 0.0)
    geo_lon = (ramc_deg - gast + 540.0) % 360.0 - 180.0
    return round(geo_lon, 4)


def _frange(start: float, stop: float, step: float):
    val = start
    while val <= stop + 1e-9:
        yield val
        val += step


def _split_antimeridian(coords: list[list[float]]) -> list[list[list[float]]]:
    """
    Split coordinate sequence into continuous segments.
    Breaks when longitude jumps by more than JUMP_THRESHOLD degrees —
    this catches both antimeridian crossings and spurious branch-switches.
    """
    if not coords:
        return []
    JUMP_THRESHOLD = 20.0  # degrees — tight enough to catch zigzags
    segments: list[list[list[float]]] = []
    current: list[list[float]] = [coords[0]]
    for i in range(1, len(coords)):
        prev_lon = coords[i - 1][0]
        curr_lon = coords[i][0]
        # Wrap-aware delta: minimum of direct and wrap-around distance
        delta = abs(curr_lon - prev_lon)
        if delta > JUMP_THRESHOLD:
            if len(current) >= 2:
                segments.append(current)
            current = [coords[i]]
        else:
            current.append(coords[i])
    if len(current) >= 2:
        segments.append(current)
    return segments


def compute_acg_lines(jd: float, language: str = "ru") -> dict:
    """
    Main entry point. Compute all 36 ACG lines for birth moment JD.

    Returns a dict ready to serialize as JSON:
    {
      "lines": [ { planet, angle, score, color, dash, label, coords: [[lon,lat],...] } ],
      "parans": [ { planet_a, angle_a, planet_b, angle_b, latitude, score, label } ],
      "zone_map": { grid of lon/lat -> aggregate score }  -- omitted for perf
    }
    """
    natal = _get_natal_positions(jd)
    gast = _gast_degrees(jd)
    _CACHED_GAST["current"] = gast

    lang = language if language in ("ru", "en") else "ru"
    p_desc = PLANET_DESC[lang]
    a_desc = ANGLE_DESC[lang]

    lines_out = []
    # Map planet -> angle -> [lon] for paran detection (MC/IC only — vertical lines)
    mc_ic_lons: dict[str, dict[str, float]] = {}

    for planet_key in PLANET_IDS:
        for angle in ANGLES:
            coords = _compute_line_for_planet_angle(planet_key, angle, natal)
            if not coords:
                continue

            score = SCORES.get((planet_key, angle), 0)
            color = PLANET_COLORS.get(planet_key, "#aaaaaa")
            segments = _split_antimeridian(coords)

            label_ru_en = f"{p_desc[planet_key]} {angle}"

            lines_out.append({
                "planet": planet_key,
                "angle": angle,
                "score": score,
                "color": color,
                "dash": LINE_DASH[angle],
                "label": label_ru_en,
                "planet_label": p_desc.get(planet_key, planet_key),
                "angle_desc": a_desc.get(angle, angle),
                "glyph": PLANET_GLYPHS.get(planet_key, ""),
                "coords": segments,
            })

            if angle in ("MC", "IC") and coords:
                mc_ic_lons.setdefault(planet_key, {})[angle] = coords[0][0]

    # ── Parans: where ASC/DSC line of one planet crosses lat of MC/IC of another ──
    parans = _compute_parans(lines_out, lang)

    return {
        "jd": jd,
        "gast": round(gast, 4),
        "lines": lines_out,
        "parans": parans,
        "meta": {
            "angles": ANGLES,
            "planet_colors": PLANET_COLORS,
            "planet_glyphs": PLANET_GLYPHS,
        },
    }


def _compute_parans(
    lines: list[dict],
    lang: str,
) -> list[dict]:
    """
    Find parans: latitude where two different planet lines intersect.
    We check vertical (MC/IC) lines against other lines' latitudes.
    Simplified: find closest lat approach between any two lines.
    """
    p_desc = PLANET_DESC[lang]
    parans = []
    seen: set[frozenset] = set()

    # Index lines by (planet, angle) for quick lookup
    line_idx: dict[tuple[str, str], list[list[float]]] = {}
    for line in lines:
        all_coords: list[list[float]] = []
        for seg in line["coords"]:
            all_coords.extend(seg)
        line_idx[(line["planet"], line["angle"])] = all_coords

    planet_keys = list(PLANET_IDS.keys())

    for i, pk_a in enumerate(planet_keys):
        for angle_a in ANGLES:
            coords_a = line_idx.get((pk_a, angle_a), [])
            if not coords_a:
                continue
            for pk_b in planet_keys[i + 1:]:
                for angle_b in ANGLES:
                    coords_b = line_idx.get((pk_b, angle_b), [])
                    if not coords_b:
                        continue

                    pair = frozenset([(pk_a, angle_a), (pk_b, angle_b)])
                    if pair in seen:
                        continue
                    seen.add(pair)

                    # Find closest approach in latitude
                    lats_a = {round(c[1], 0): c[0] for c in coords_a}
                    lats_b = {round(c[1], 0): c[0] for c in coords_b}
                    common_lats = set(lats_a.keys()) & set(lats_b.keys())

                    for lat in common_lats:
                        lon_a = lats_a[lat]
                        lon_b = lats_b[lat]
                        lon_diff = abs(lon_a - lon_b)
                        if lon_diff > 180:
                            lon_diff = 360 - lon_diff
                        if lon_diff < 8:  # within ~800km — paran zone
                            score_a = SCORES.get((pk_a, angle_a), 0)
                            score_b = SCORES.get((pk_b, angle_b), 0)
                            combined = round((score_a + score_b) / 2, 1)
                            mid_lon = round((lon_a + lon_b) / 2, 2)

                            parans.append({
                                "planet_a": pk_a,
                                "angle_a": angle_a,
                                "planet_b": pk_b,
                                "angle_b": angle_b,
                                "latitude": float(lat),
                                "longitude": mid_lon,
                                "score": combined,
                                "label": f"{p_desc[pk_a]} {angle_a} × {p_desc[pk_b]} {angle_b}",
                                "glyph_a": PLANET_GLYPHS.get(pk_a, ""),
                                "glyph_b": PLANET_GLYPHS.get(pk_b, ""),
                            })

    # Sort by abs score descending
    parans.sort(key=lambda p: abs(p["score"]), reverse=True)
    return parans[:40]  # top 40 most significant
