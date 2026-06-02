SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]

PLANET_DISPLAY = {
    "sun": "Sun",
    "moon": "Moon",
    "mars": "Mars",
    "mercury": "Mercury",
    "jupiter": "Jupiter",
    "venus": "Venus",
    "saturn": "Saturn",
    "rahu": "Rahu",
    "ketu": "Ketu",
}


def normalize_longitude(lon: float) -> float:
    return lon % 360.0


def format_degree(deg: float) -> str:
    d = int(deg)
    m = round((deg - d) * 60)
    if m == 60:
        d += 1
        m = 0
    return f"{d:02d}°{m:02d}'"


def normalize_key(text: str) -> str:
    return text.lower().replace(" ", "_")
