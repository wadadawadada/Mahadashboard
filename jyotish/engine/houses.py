from __future__ import annotations

from jyotish.engine.utils import SIGNS
from jyotish.schemas import HouseData, PlanetData

SIGN_LORDS: dict[str, str] = {
    "Aries": "Mars",
    "Taurus": "Venus",
    "Gemini": "Mercury",
    "Cancer": "Moon",
    "Leo": "Sun",
    "Virgo": "Mercury",
    "Libra": "Venus",
    "Scorpio": "Mars",
    "Sagittarius": "Jupiter",
    "Capricorn": "Saturn",
    "Aquarius": "Saturn",
    "Pisces": "Jupiter",
}


def build_whole_sign_houses(
    lagna_sign: str,
    planets: dict[str, PlanetData],
) -> dict[str, HouseData]:
    lagna_idx = SIGNS.index(lagna_sign)
    houses: dict[str, HouseData] = {}

    for i in range(12):
        house_num = i + 1
        sign_idx = (lagna_idx + i) % 12
        sign = SIGNS[sign_idx]
        lord = SIGN_LORDS[sign]
        planets_in_house = [p.name for p in planets.values() if p.sign == sign]
        clickable_keys = [
            f"house:{house_num}",
            f"house:{house_num}:sign:{sign.lower()}",
            f"house:{house_num}:lord:{lord.lower()}",
        ]
        houses[str(house_num)] = HouseData(
            number=house_num,
            sign=sign,
            lord=lord,
            planets=planets_in_house,
            clickable_keys=clickable_keys,
        )

    return houses


def get_planet_house(planet_sign: str, lagna_sign: str) -> int:
    lagna_idx = SIGNS.index(lagna_sign)
    planet_idx = SIGNS.index(planet_sign)
    return (planet_idx - lagna_idx) % 12 + 1


def get_ruler_of_houses(planet_key: str, lagna_sign: str) -> list[int]:
    lagna_idx = SIGNS.index(lagna_sign)
    ruled = []
    for house_num in range(1, 13):
        sign_idx = (lagna_idx + house_num - 1) % 12
        sign = SIGNS[sign_idx]
        lord_key = SIGN_LORDS[sign].lower()
        if lord_key == planet_key:
            ruled.append(house_num)
    return ruled
