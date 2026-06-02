from __future__ import annotations

from jyotish.schemas import AspectData, HouseData, PlanetData

STANDARD_ASPECT_OFFSETS: set[int] = {7}

SPECIAL_ASPECT_OFFSETS: dict[str, set[int]] = {
    "mars": {4, 7, 8},
    "jupiter": {5, 7, 9},
    "saturn": {3, 7, 10},
    "rahu": {5, 7, 9},
    "ketu": {5, 7, 9},
}


def get_aspect_houses(planet_key: str, from_house: int, enable_node_aspects: bool) -> set[int]:
    if planet_key in ("rahu", "ketu") and not enable_node_aspects:
        return set()
    offsets = SPECIAL_ASPECT_OFFSETS.get(planet_key, STANDARD_ASPECT_OFFSETS)
    return {((from_house - 1 + offset - 1) % 12) + 1 for offset in offsets}


def calculate_aspects(
    planets: dict[str, PlanetData],
    houses: dict[str, HouseData],
    enable_node_aspects: bool = False,
) -> list[AspectData]:
    aspects: list[AspectData] = []

    for planet_key, planet in planets.items():
        target_houses = get_aspect_houses(planet_key, planet.house, enable_node_aspects)
        for target_num in sorted(target_houses):
            target_house = houses[str(target_num)]
            offset = (target_num - planet.house) % 12 or 12
            clickable_key = (
                f"aspect:{planet_key}:{offset}th:house:{target_num}"
            )
            aspects.append(AspectData(
                from_planet=planet.name,
                from_house=planet.house,
                aspect=f"{offset}th",
                to_house=target_num,
                to_sign=target_house.sign,
                clickable_key=clickable_key,
            ))

    return aspects
