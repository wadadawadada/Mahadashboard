from __future__ import annotations

from jyotish.engine.utils import normalize_key
from jyotish.schemas import AspectData, DashaData, HouseData, LagnaData, PlanetData


def lagna_keys(sign: str, nakshatra: str, pada: int) -> list[str]:
    nk = normalize_key(nakshatra)
    return [
        f"lagna:{sign.lower()}",
        f"lagna:nakshatra:{nk}",
        f"lagna:nakshatra:{nk}:pada:{pada}",
    ]


def planet_keys(planet_key: str, sign: str, nakshatra: str, pada: int, house: int) -> list[str]:
    nk = normalize_key(nakshatra)
    return [
        f"planet:{planet_key}",
        f"planet:{planet_key}:sign:{sign.lower()}",
        f"planet:{planet_key}:nakshatra:{nk}",
        f"planet:{planet_key}:nakshatra:{nk}:pada:{pada}",
        f"planet:{planet_key}:house:{house}",
    ]


def house_keys(house_num: int, sign: str, lord: str) -> list[str]:
    return [
        f"house:{house_num}",
        f"house:{house_num}:sign:{sign.lower()}",
        f"house:{house_num}:lord:{lord.lower()}",
    ]


def dasha_keys(mahadasha: str, antardasha: str | None = None) -> list[str]:
    maha = mahadasha.lower()
    keys = [f"dasha:{maha}:mahadasha"]
    if antardasha:
        antar = antardasha.lower()
        keys.append(f"dasha:{antar}:antardasha")
        keys.append(f"dasha:{maha}:{antar}")
    return keys


def aspect_keys(planet_key: str, offset: int, to_house: int) -> list[str]:
    return [
        f"aspect:{planet_key}:{offset}th",
        f"aspect:{planet_key}:{offset}th:house:{to_house}",
    ]


def all_interpretation_keys(
    lagna: LagnaData,
    planets: dict[str, PlanetData],
    houses: dict[str, HouseData],
    dashas: DashaData,
    aspects: list[AspectData],
) -> list[str]:
    seen: set[str] = set()
    keys: list[str] = []

    def add(k: str):
        if k not in seen:
            seen.add(k)
            keys.append(k)

    for k in lagna_keys(lagna.sign, lagna.nakshatra, lagna.pada):
        add(k)

    for planet in planets.values():
        for k in planet_keys(planet.key, planet.sign, planet.nakshatra, planet.pada, planet.house):
            add(k)

    for house_num, house in houses.items():
        for k in house_keys(int(house_num), house.sign, house.lord):
            add(k)

    maha = dashas.current.mahadasha
    antar = dashas.current.antardasha
    for k in dasha_keys(maha, antar):
        add(k)

    for aspect in aspects:
        offset_int = int(aspect.aspect.replace("th", ""))
        for k in aspect_keys(aspect.from_planet.lower(), offset_int, aspect.to_house):
            add(k)

    return keys
