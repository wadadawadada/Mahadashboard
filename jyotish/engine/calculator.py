from __future__ import annotations

from datetime import date, datetime, timezone
from pathlib import Path

from jyotish.engine import aspects as asp_mod
from jyotish.engine import dashas as dasha_mod
from jyotish.engine import divisional, ephemeris, houses as house_mod
from jyotish.engine.dignity import get_dignity
from jyotish.engine.location import resolve_location
from jyotish.engine.nakshatra import get_nakshatra, get_pada
from jyotish.engine.timezone import local_to_utc, to_julian_day
from jyotish.engine.utils import PLANET_DISPLAY, format_degree, normalize_key
from jyotish.engine.zodiac import get_sign, get_sign_degree
from jyotish.reports.keys import (
    all_interpretation_keys,
    aspect_keys,
    dasha_keys,
    house_keys,
    lagna_keys,
    planet_keys,
)
from jyotish.schemas import (
    AspectData,
    BirthData,
    BirthInput,
    ChartMeta,
    ChartOutput,
    HouseData,
    LagnaData,
    PlanetData,
    ResolvedLocation,
)

_DEFAULT_PLACES = Path(__file__).parent.parent.parent / "data" / "places" / "places.json"


def calculate_chart(
    birth: BirthInput,
    places_path: Path = _DEFAULT_PLACES,
    today: date | None = None,
) -> ChartOutput:
    if today is None:
        today = date.today()

    warnings: list[str] = []

    location: ResolvedLocation = resolve_location(birth.city, birth.country, places_path)
    utc_dt: datetime = local_to_utc(birth.birth_date, birth.birth_time, location.timezone)
    jd: float = to_julian_day(utc_dt)
    ayanamsa: float = ephemeris.get_ayanamsa(jd)

    raw_positions = ephemeris.calculate_positions(jd)
    lagna_lon = ephemeris.calculate_lagna(jd, location.latitude, location.longitude)

    lagna_sign = get_sign(lagna_lon)
    lagna_sign_deg = get_sign_degree(lagna_lon)
    lagna_nakshatra = get_nakshatra(lagna_lon)
    lagna_pada = get_pada(lagna_lon)
    lagna_ck = lagna_keys(lagna_sign, lagna_nakshatra, lagna_pada)

    lagna = LagnaData(
        sign=lagna_sign,
        degree=round(lagna_sign_deg, 4),
        degree_formatted=format_degree(lagna_sign_deg),
        nakshatra=lagna_nakshatra,
        pada=lagna_pada,
        clickable_keys=lagna_ck,
    )

    planet_objects: dict[str, PlanetData] = {}
    for key, raw in raw_positions.items():
        lon = raw["longitude_sidereal"]
        sign = get_sign(lon)
        sign_deg = get_sign_degree(lon)
        nakshatra = get_nakshatra(lon)
        pada = get_pada(lon)
        dignity = get_dignity(key, sign)
        retrograde = raw["retrograde"]

        planet_objects[key] = PlanetData(
            name=PLANET_DISPLAY[key],
            key=key,
            longitude_sidereal=round(lon, 4),
            sign=sign,
            sign_degree=round(sign_deg, 4),
            degree_formatted=format_degree(sign_deg),
            house=0,
            nakshatra=nakshatra,
            pada=pada,
            retrograde=retrograde,
            ruler_of_houses=[],
            dignity=dignity,
            clickable_keys=[],
        )

    houses_map: dict[str, HouseData] = house_mod.build_whole_sign_houses(lagna_sign, planet_objects)

    for key, planet in planet_objects.items():
        house_num = house_mod.get_planet_house(planet.sign, lagna_sign)
        ruler_of = house_mod.get_ruler_of_houses(key, lagna_sign)
        ck = planet_keys(key, planet.sign, planet.nakshatra, planet.pada, house_num)
        planet_objects[key] = planet.model_copy(update={
            "house": house_num,
            "ruler_of_houses": ruler_of,
            "clickable_keys": ck,
        })

    for house_key, house_data in houses_map.items():
        updated_planets = [p.name for p in planet_objects.values() if str(house_mod.get_planet_house(p.sign, lagna_sign)) == house_key]
        houses_map[house_key] = house_data.model_copy(update={"planets": updated_planets})

    aspects: list[AspectData] = asp_mod.calculate_aspects(
        planet_objects, houses_map, birth.settings.enable_node_aspects
    )

    moon_lon = raw_positions["moon"]["longitude_sidereal"]
    dashas = dasha_mod.calculate_dashas(utc_dt, moon_lon, today)

    d9_planets: dict[str, dict] = {}
    if birth.settings.include_navamsa:
        for key, planet in planet_objects.items():
            d9_sign = divisional.get_navamsa_sign(planet.longitude_sidereal)
            d9_planets[key] = {
                "sign": d9_sign,
                "clickable_key": f"d9:{key}:sign:{normalize_key(d9_sign)}",
            }

    interp_keys = all_interpretation_keys(
        lagna, planet_objects, houses_map, dashas, aspects
    )

    meta = ChartMeta(
        zodiac=birth.settings.zodiac,
        ayanamsa=birth.settings.ayanamsa,
        house_system=birth.settings.house_system,
        dasha_system=birth.settings.dasha_system,
        language=birth.language,
        calculated_at=datetime.now(timezone.utc).isoformat(),
    )

    birth_data = BirthData(
        name=birth.name,
        local_date=birth.birth_date,
        local_time=birth.birth_time,
        city=birth.city,
        country=birth.country,
        latitude=location.latitude,
        longitude=location.longitude,
        timezone=location.timezone,
        utc_datetime=utc_dt.isoformat(),
        julian_day=round(jd, 6),
    )

    return ChartOutput(
        meta=meta,
        birth=birth_data,
        lagna=lagna,
        planets=planet_objects,
        houses=houses_map,
        aspects=aspects,
        dashas=dashas,
        divisional_charts={"D1": {}, "D9": {"planets": d9_planets}},
        interpretation_keys=interp_keys,
        warnings=warnings,
    )
