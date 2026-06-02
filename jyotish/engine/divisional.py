from jyotish.engine.utils import SIGNS

# Navamsa starting sign by element of the D1 sign (fire=0, earth=1, air=2, water=3)
_ELEMENT_START: list[int] = [0, 3, 6, 9]  # Aries, Cancer, Libra, Capricorn

# Sign indices by element: Aries(0)=fire, Taurus(1)=earth, Gemini(2)=air, Cancer(3)=water, ...
_SIGN_ELEMENT: list[int] = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3]


def get_navamsa_sign(longitude: float) -> str:
    lon = longitude % 360.0
    sign_idx = int(lon / 30) % 12
    degree_in_sign = lon % 30
    navamsa_num = int(degree_in_sign / (30.0 / 9))  # 0-8
    navamsa_num = min(navamsa_num, 8)

    element = _SIGN_ELEMENT[sign_idx]
    start_idx = _ELEMENT_START[element]
    navamsa_sign_idx = (start_idx + navamsa_num) % 12
    return SIGNS[navamsa_sign_idx]
