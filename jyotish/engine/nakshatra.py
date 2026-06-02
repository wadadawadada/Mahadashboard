from jyotish.engine.utils import normalize_longitude

NAKSHATRAS = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni",
    "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha",
    "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana",
    "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
]

NAKSHATRA_SPAN = 360.0 / 27  # 13.3333...°
PADA_SPAN = 360.0 / 108      # 3.3333...°


def get_nakshatra(longitude: float) -> str:
    lon = normalize_longitude(longitude)
    idx = int(lon / NAKSHATRA_SPAN) % 27
    return NAKSHATRAS[idx]


def get_pada(longitude: float) -> int:
    lon = normalize_longitude(longitude)
    pos_within = lon % NAKSHATRA_SPAN
    pada = int(pos_within / PADA_SPAN) + 1
    return min(pada, 4)


def get_nakshatra_index(nakshatra: str) -> int:
    return NAKSHATRAS.index(nakshatra)
