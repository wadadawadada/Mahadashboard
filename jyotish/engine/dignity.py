EXALTATION: dict[str, str] = {
    "sun": "Aries",
    "moon": "Taurus",
    "mars": "Capricorn",
    "mercury": "Virgo",
    "jupiter": "Cancer",
    "venus": "Pisces",
    "saturn": "Libra",
    "rahu": "Gemini",
    "ketu": "Sagittarius",
}

DEBILITATION: dict[str, str] = {
    "sun": "Libra",
    "moon": "Scorpio",
    "mars": "Cancer",
    "mercury": "Pisces",
    "jupiter": "Capricorn",
    "venus": "Virgo",
    "saturn": "Aries",
    "rahu": "Sagittarius",
    "ketu": "Gemini",
}

OWN_SIGNS: dict[str, list[str]] = {
    "sun": ["Leo"],
    "moon": ["Cancer"],
    "mars": ["Aries", "Scorpio"],
    "mercury": ["Gemini", "Virgo"],
    "jupiter": ["Sagittarius", "Pisces"],
    "venus": ["Taurus", "Libra"],
    "saturn": ["Capricorn", "Aquarius"],
    "rahu": [],
    "ketu": [],
}


def get_dignity(planet_key: str, sign: str) -> str:
    if EXALTATION.get(planet_key) == sign:
        return "exalted"
    if DEBILITATION.get(planet_key) == sign:
        return "debilitated"
    if sign in OWN_SIGNS.get(planet_key, []):
        return "own_sign"
    return "neutral"
