from jyotish.engine.utils import SIGNS, normalize_longitude


def get_sign(longitude: float) -> str:
    lon = normalize_longitude(longitude)
    idx = int(lon / 30) % 12
    return SIGNS[idx]


def get_sign_degree(longitude: float) -> float:
    return normalize_longitude(longitude) % 30
