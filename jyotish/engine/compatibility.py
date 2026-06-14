from __future__ import annotations

from typing import Any

from jyotish.engine.nakshatra import NAKSHATRAS
from jyotish.engine.utils import SIGNS


SIGN_LORDS = {
    "Aries": "mars",
    "Taurus": "venus",
    "Gemini": "mercury",
    "Cancer": "moon",
    "Leo": "sun",
    "Virgo": "mercury",
    "Libra": "venus",
    "Scorpio": "mars",
    "Sagittarius": "jupiter",
    "Capricorn": "saturn",
    "Aquarius": "saturn",
    "Pisces": "jupiter",
}

VARNA = {
    "Cancer": "brahmin",
    "Scorpio": "brahmin",
    "Pisces": "brahmin",
    "Aries": "kshatriya",
    "Leo": "kshatriya",
    "Sagittarius": "kshatriya",
    "Taurus": "vaishya",
    "Virgo": "vaishya",
    "Capricorn": "vaishya",
    "Gemini": "shudra",
    "Libra": "shudra",
    "Aquarius": "shudra",
}

VASHYA = {
    "Aries": "quadruped",
    "Taurus": "quadruped",
    "Gemini": "human",
    "Cancer": "water",
    "Leo": "wild",
    "Virgo": "human",
    "Libra": "human",
    "Scorpio": "insect",
    "Sagittarius": "human",
    "Capricorn": "quadruped",
    "Aquarius": "human",
    "Pisces": "water",
}

GANA = {
    "Ashwini": "deva",
    "Mrigashira": "deva",
    "Punarvasu": "deva",
    "Pushya": "deva",
    "Hasta": "deva",
    "Swati": "deva",
    "Anuradha": "deva",
    "Shravana": "deva",
    "Revati": "deva",
    "Bharani": "manushya",
    "Rohini": "manushya",
    "Ardra": "manushya",
    "Purva Phalguni": "manushya",
    "Uttara Phalguni": "manushya",
    "Purva Ashadha": "manushya",
    "Uttara Ashadha": "manushya",
    "Purva Bhadrapada": "manushya",
    "Uttara Bhadrapada": "manushya",
    "Krittika": "rakshasa",
    "Ashlesha": "rakshasa",
    "Magha": "rakshasa",
    "Chitra": "rakshasa",
    "Vishakha": "rakshasa",
    "Jyeshtha": "rakshasa",
    "Mula": "rakshasa",
    "Dhanishta": "rakshasa",
    "Shatabhisha": "rakshasa",
}

YONI = {
    "Ashwini": "horse",
    "Bharani": "elephant",
    "Krittika": "sheep",
    "Rohini": "serpent",
    "Mrigashira": "serpent",
    "Ardra": "dog",
    "Punarvasu": "cat",
    "Pushya": "sheep",
    "Ashlesha": "cat",
    "Magha": "rat",
    "Purva Phalguni": "rat",
    "Uttara Phalguni": "cow",
    "Hasta": "buffalo",
    "Chitra": "tiger",
    "Swati": "buffalo",
    "Vishakha": "tiger",
    "Anuradha": "deer",
    "Jyeshtha": "deer",
    "Mula": "dog",
    "Purva Ashadha": "monkey",
    "Uttara Ashadha": "mongoose",
    "Shravana": "monkey",
    "Dhanishta": "lion",
    "Shatabhisha": "horse",
    "Purva Bhadrapada": "lion",
    "Uttara Bhadrapada": "cow",
    "Revati": "elephant",
}

YONI_ENEMIES = {
    frozenset(("horse", "buffalo")),
    frozenset(("elephant", "lion")),
    frozenset(("sheep", "monkey")),
    frozenset(("serpent", "mongoose")),
    frozenset(("dog", "deer")),
    frozenset(("cat", "rat")),
    frozenset(("cow", "tiger")),
}

NADI = {
    "Ashwini": "adi",
    "Ardra": "adi",
    "Punarvasu": "adi",
    "Uttara Phalguni": "adi",
    "Hasta": "adi",
    "Jyeshtha": "adi",
    "Mula": "adi",
    "Shatabhisha": "adi",
    "Purva Bhadrapada": "adi",
    "Bharani": "madhya",
    "Mrigashira": "madhya",
    "Pushya": "madhya",
    "Purva Phalguni": "madhya",
    "Chitra": "madhya",
    "Anuradha": "madhya",
    "Purva Ashadha": "madhya",
    "Dhanishta": "madhya",
    "Uttara Bhadrapada": "madhya",
    "Krittika": "antya",
    "Rohini": "antya",
    "Ashlesha": "antya",
    "Magha": "antya",
    "Swati": "antya",
    "Vishakha": "antya",
    "Uttara Ashadha": "antya",
    "Shravana": "antya",
    "Revati": "antya",
}

PLANET_RELATIONS = {
    "sun": {"friends": {"moon", "mars", "jupiter"}, "neutral": {"mercury"}, "enemies": {"venus", "saturn"}},
    "moon": {"friends": {"sun", "mercury"}, "neutral": {"mars", "jupiter", "venus", "saturn"}, "enemies": set()},
    "mars": {"friends": {"sun", "moon", "jupiter"}, "neutral": {"venus", "saturn"}, "enemies": {"mercury"}},
    "mercury": {"friends": {"sun", "venus"}, "neutral": {"mars", "jupiter", "saturn"}, "enemies": {"moon"}},
    "jupiter": {"friends": {"sun", "moon", "mars"}, "neutral": {"saturn"}, "enemies": {"mercury", "venus"}},
    "venus": {"friends": {"mercury", "saturn"}, "neutral": {"mars", "jupiter"}, "enemies": {"sun", "moon"}},
    "saturn": {"friends": {"mercury", "venus"}, "neutral": {"jupiter"}, "enemies": {"sun", "moon", "mars"}},
}

FRIENDLY_YONI_GROUPS = [
    {"horse", "elephant", "cow"},
    {"sheep", "deer", "buffalo"},
    {"cat", "serpent", "mongoose"},
    {"dog", "rat", "monkey"},
    {"lion", "tiger"},
]

MANGAL_HOUSES = {1, 2, 4, 7, 8, 12}


def calculate_compatibility(
    chart_a: dict[str, Any],
    chart_b: dict[str, Any],
    language: str = "ru",
    context: str = "romance",
) -> dict[str, Any]:
    moon_a = _planet(chart_a, "moon")
    moon_b = _planet(chart_b, "moon")
    sign_a = moon_a.get("sign")
    sign_b = moon_b.get("sign")
    nak_a = moon_a.get("nakshatra")
    nak_b = moon_b.get("nakshatra")
    bhakoot_score, bhakoot_note_ru, bhakoot_note_en = _bhakoot_result(sign_a, sign_b)

    kuta = [
        _kuta("inner_values", "Базовые ценности", "Core values", 1, _varna_score(sign_a, sign_b), "varna"),
        _kuta("daily_rhythm", "Бытовой ритм", "Daily rhythm", 2, _vashya_score(sign_a, sign_b), "vashya"),
        _kuta("emotional_flow", "Эмоциональный поток", "Emotional flow", 3, _tara_score(nak_a, nak_b), "tara"),
        _kuta("physical_chemistry", "Физическая химия", "Physical chemistry", 4, _yoni_score(nak_a, nak_b), "yoni"),
        _kuta("mindset", "Общий язык", "Shared mindset", 5, _graha_maitri_score(sign_a, sign_b), "graha_maitri"),
        _kuta("temperament", "Темперамент", "Temperament", 6, _gana_score(nak_a, nak_b), "gana"),
        _kuta(
            "life_direction",
            "Общий жизненный вектор",
            "Shared life direction",
            7,
            bhakoot_score,
            "bhakoot",
            note_ru=bhakoot_note_ru,
            note_en=bhakoot_note_en,
        ),
        _kuta("health_family", "Семейная гармония", "Family harmony", 8, _nadi_score(nak_a, nak_b), "nadi"),
    ]

    total = round(sum(item["score"] for item in kuta), 2)
    percent = round((total / 36.0) * 100)
    mangal = _mangal_result(chart_a, chart_b, language)
    adjusted_percent = max(0, min(100, percent - mangal["penalty"]))

    categories = _build_categories(kuta, mangal)
    context_view = _build_context_view(categories, context, language)
    flags = _build_flags(kuta, mangal, language)

    return {
        "method": {
            "id": "ashta_kuta_gender_neutral",
            "name": "Ashta Kuta / 36-point lunar compatibility",
            "language": language,
            "note": _text(
                language,
                "Расчёт использует классическую лунную систему 36 баллов, но в нейтральной форме: в профилях нет пола партнёров.",
                "Uses the classical 36-point lunar method in a neutral form because profiles do not store partner gender.",
            ),
        },
        "score": {
            "points": total,
            "max_points": 36,
            "percent": percent,
            "adjusted_percent": adjusted_percent,
            "context_percent": max(0, min(100, context_view["percent"] - mangal["penalty"])),
            "label": _score_label(adjusted_percent, language),
        },
        "kuta": kuta,
        "categories": categories,
        "context_view": context_view,
        "mangal": mangal,
        "flags": flags,
        "summary": _summary(adjusted_percent, total, flags, language, context_view),
    }


def _planet(chart: dict[str, Any], key: str) -> dict[str, Any]:
    value = (chart.get("planets") or {}).get(key)
    return value if isinstance(value, dict) else {}


def _kuta(
    id_: str,
    label_ru: str,
    label_en: str,
    max_score: int,
    score: float,
    traditional_key: str,
    note_ru: str = "",
    note_en: str = "",
) -> dict[str, Any]:
    pct = 0 if max_score <= 0 else round(score / max_score * 100)
    return {
        "id": id_,
        "traditional_key": traditional_key,
        "label_ru": label_ru,
        "label_en": label_en,
        "score": round(score, 2),
        "max": max_score,
        "percent": pct,
        "status": _status(pct),
        "note_ru": note_ru,
        "note_en": note_en,
    }


def _status(percent: int) -> str:
    if percent >= 75:
        return "strong"
    if percent >= 45:
        return "mixed"
    return "weak"


def _varna_score(sign_a: str | None, sign_b: str | None) -> float:
    if not sign_a or not sign_b:
        return 0
    return 1.0 if VARNA.get(sign_a) == VARNA.get(sign_b) else 0.5


def _vashya_score(sign_a: str | None, sign_b: str | None) -> float:
    if not sign_a or not sign_b:
        return 0
    a = VASHYA.get(sign_a)
    b = VASHYA.get(sign_b)
    if a == b:
        return 2.0
    if {a, b} <= {"human", "quadruped"} or {a, b} <= {"water", "human"}:
        return 1.0
    return 0.5


def _tara_score(nak_a: str | None, nak_b: str | None) -> float:
    if nak_a not in NAKSHATRAS or nak_b not in NAKSHATRAS:
        return 0
    a = NAKSHATRAS.index(nak_a)
    b = NAKSHATRAS.index(nak_b)
    return _tara_direction_score(a, b) + _tara_direction_score(b, a)


def _tara_direction_score(from_idx: int, to_idx: int) -> float:
    count = (to_idx - from_idx) % 27 + 1
    remainder = count % 9 or 9
    return 1.5 if remainder not in {3, 5, 7} else 0.0


def _yoni_score(nak_a: str | None, nak_b: str | None) -> float:
    a = YONI.get(nak_a or "")
    b = YONI.get(nak_b or "")
    if not a or not b:
        return 0
    if a == b:
        return 4.0
    if frozenset((a, b)) in YONI_ENEMIES:
        return 0.0
    if any(a in group and b in group for group in FRIENDLY_YONI_GROUPS):
        return 3.0
    return 2.0


def _graha_maitri_score(sign_a: str | None, sign_b: str | None) -> float:
    lord_a = SIGN_LORDS.get(sign_a or "")
    lord_b = SIGN_LORDS.get(sign_b or "")
    if not lord_a or not lord_b:
        return 0
    if lord_a == lord_b:
        return 5.0
    rel_ab = _relation(lord_a, lord_b)
    rel_ba = _relation(lord_b, lord_a)
    pair = {rel_ab, rel_ba}
    if pair == {"friend"}:
        return 5.0
    if pair == {"friend", "neutral"}:
        return 4.0
    if pair == {"neutral"}:
        return 3.0
    if "enemy" in pair and "friend" in pair:
        return 1.0
    if "enemy" in pair and "neutral" in pair:
        return 1.0
    return 0.0


def _relation(planet_a: str, planet_b: str) -> str:
    data = PLANET_RELATIONS[planet_a]
    if planet_b in data["friends"]:
        return "friend"
    if planet_b in data["enemies"]:
        return "enemy"
    return "neutral"


def _gana_score(nak_a: str | None, nak_b: str | None) -> float:
    a = GANA.get(nak_a or "")
    b = GANA.get(nak_b or "")
    if not a or not b:
        return 0
    if a == b:
        return 6.0
    if {a, b} == {"deva", "manushya"}:
        return 5.0
    if {a, b} == {"deva", "rakshasa"}:
        return 1.0
    return 0.0


def _bhakoot_score(sign_a: str | None, sign_b: str | None) -> float:
    score, _, _ = _bhakoot_result(sign_a, sign_b)
    return score


def _bhakoot_result(sign_a: str | None, sign_b: str | None) -> tuple[float, str, str]:
    if sign_a not in SIGNS or sign_b not in SIGNS:
        return (
            0.0,
            "Не хватает данных о лунных знаках, поэтому фактор нельзя оценить точно.",
            "Moon-sign data is missing, so this factor cannot be evaluated accurately.",
        )
    dist_ab = (SIGNS.index(sign_b) - SIGNS.index(sign_a)) % 12 + 1
    dist_ba = (SIGNS.index(sign_a) - SIGNS.index(sign_b)) % 12 + 1
    pair = (dist_ab, dist_ba)
    if pair in {(2, 12), (12, 2)}:
        return (
            0.0,
            "Внутренние эмоциональные ритмы стоят в связке 2/12: одному важнее удерживать и накапливать, другому легче отпускать и менять курс. Поэтому классическая таблица даёт 0 из 7.",
            "The inner emotional rhythms form a 2/12 pattern: one side tends to hold and build, while the other more easily releases and changes course. The classical table gives 0 of 7 for this pattern.",
        )
    if pair in {(5, 9), (9, 5)}:
        return (
            0.0,
            "Внутренние эмоциональные ритмы стоят в связке 5/9: есть притяжение и обучение друг у друга, но долгий общий курс может ощущаться неравным. Поэтому классическая таблица даёт 0 из 7.",
            "The inner emotional rhythms form a 5/9 pattern: there can be attraction and learning, but the shared long-term course may feel uneven. The classical table gives 0 of 7 for this pattern.",
        )
    if pair in {(6, 8), (8, 6)}:
        return (
            0.0,
            "Внутренние эмоциональные ритмы стоят в связке 6/8: это часто даёт разный способ реагировать на стресс, обязанности и кризисы. Поэтому классическая таблица даёт 0 из 7.",
            "The inner emotional rhythms form a 6/8 pattern: stress, duties, and crises are often handled differently. The classical table gives 0 of 7 for this pattern.",
        )
    return (
        7.0,
        "Внутренние эмоциональные ритмы не попадают в конфликтные связки 2/12, 5/9 или 6/8, поэтому общий жизненный курс считается поддерживающим.",
        "The inner emotional rhythms do not fall into the challenging 2/12, 5/9, or 6/8 patterns, so the shared life direction is considered supportive.",
    )


def _nadi_score(nak_a: str | None, nak_b: str | None) -> float:
    a = NADI.get(nak_a or "")
    b = NADI.get(nak_b or "")
    if not a or not b:
        return 0
    return 0.0 if a == b else 8.0


def _mangal_result(chart_a: dict[str, Any], chart_b: dict[str, Any], language: str) -> dict[str, Any]:
    profile_a = _mangal_profile(chart_a)
    profile_b = _mangal_profile(chart_b)
    mismatch = profile_a["level"] != profile_b["level"] and max(profile_a["level"], profile_b["level"]) >= 2
    penalty = 10 if mismatch else 0
    status = "balanced" if profile_a["has_dosha"] == profile_b["has_dosha"] else "mismatch"
    return {
        "label": _text(language, "Проверка конфликтности", "Conflict-pattern check"),
        "status": status,
        "penalty": penalty,
        "a": profile_a,
        "b": profile_b,
        "message": _mangal_message(profile_a, profile_b, language),
    }


def _mangal_profile(chart: dict[str, Any]) -> dict[str, Any]:
    mars = _planet(chart, "mars")
    mars_sign = mars.get("sign")
    refs = {
        "lagna": (chart.get("lagna") or {}).get("sign"),
        "moon": _planet(chart, "moon").get("sign"),
        "venus": _planet(chart, "venus").get("sign"),
    }
    hits = []
    for ref_name, ref_sign in refs.items():
        house = _house_from(ref_sign, mars_sign)
        if house in MANGAL_HOUSES:
            hits.append({"from": ref_name, "house": house})
    mitigated = mars.get("dignity") in {"own", "exalted", "moolatrikona"}
    level = max(0, len(hits) - (1 if mitigated else 0))
    return {
        "has_dosha": level > 0,
        "level": level,
        "hits": hits,
        "mitigated": mitigated,
    }


def _house_from(reference_sign: str | None, planet_sign: str | None) -> int | None:
    if reference_sign not in SIGNS or planet_sign not in SIGNS:
        return None
    return (SIGNS.index(planet_sign) - SIGNS.index(reference_sign)) % 12 + 1


def _build_categories(kuta: list[dict[str, Any]], mangal: dict[str, Any]) -> list[dict[str, Any]]:
    by_id = {item["id"]: item for item in kuta}
    chemistry = round(by_id["physical_chemistry"]["percent"] * 0.65 + (100 - mangal["penalty"] * 5) * 0.35)
    stability = _weighted_percent(by_id, ["life_direction", "health_family", "mindset"])
    if by_id["life_direction"]["score"] == 0 and by_id["health_family"]["score"] == 0:
        stability = min(stability, 35)
    elif by_id["life_direction"]["score"] == 0 or by_id["health_family"]["score"] == 0:
        stability = min(stability, 59)
    return [
        {"id": "emotional", "label_ru": "Эмоциональная близость", "label_en": "Emotional closeness", "percent": _weighted_percent(by_id, ["emotional_flow", "temperament", "health_family"])},
        {"id": "daily", "label_ru": "Быт и общение", "label_en": "Daily life and communication", "percent": _weighted_percent(by_id, ["daily_rhythm", "mindset", "inner_values"])},
        {"id": "chemistry", "label_ru": "Физическая химия", "label_en": "Physical chemistry", "percent": chemistry},
        {"id": "stability", "label_ru": "Долгосрочная устойчивость", "label_en": "Long-term stability", "percent": stability},
    ]


def _build_context_view(categories: list[dict[str, Any]], context: str, language: str) -> dict[str, Any]:
    by_id = {item["id"]: item for item in categories}
    config = {
        "romance": {
            "label_ru": "Романтика",
            "label_en": "Romance",
            "weights": {"emotional": 0.35, "chemistry": 0.35, "stability": 0.20, "daily": 0.10},
            "focus": ["emotional", "chemistry", "stability", "daily"],
            "note_ru": "В этом режиме сильнее учитываются эмоциональная близость и физическая химия.",
            "note_en": "This view emphasizes emotional closeness and physical chemistry.",
        },
        "business": {
            "label_ru": "Бизнес",
            "label_en": "Business",
            "weights": {"daily": 0.45, "stability": 0.35, "emotional": 0.15, "chemistry": 0.05},
            "focus": ["daily", "stability", "emotional", "chemistry"],
            "note_ru": "В этом режиме важнее общий язык, надёжность и способность договариваться.",
            "note_en": "This view emphasizes communication, reliability, and agreement.",
        },
        "friendship": {
            "label_ru": "Дружба",
            "label_en": "Friendship",
            "weights": {"daily": 0.40, "emotional": 0.35, "stability": 0.20, "chemistry": 0.05},
            "focus": ["daily", "emotional", "stability", "chemistry"],
            "note_ru": "В этом режиме важнее лёгкость общения, доверие и похожий бытовой ритм.",
            "note_en": "This view emphasizes ease of communication, trust, and daily rhythm.",
        },
        "karma": {
            "label_ru": "Глубокая связь",
            "label_en": "Deep bond",
            "weights": {"stability": 0.40, "emotional": 0.30, "chemistry": 0.15, "daily": 0.15},
            "focus": ["stability", "emotional", "daily", "chemistry"],
            "note_ru": "В этом режиме важнее долгосрочные уроки, устойчивость и эмоциональная глубина.",
            "note_en": "This view emphasizes long-term lessons, stability, and emotional depth.",
        },
    }.get(context, {})

    if not config:
        return _build_context_view(categories, "romance", language)

    percent = round(sum(by_id[key]["percent"] * weight for key, weight in config["weights"].items()))
    ordered = [by_id[key] for key in config["focus"] if key in by_id]
    return {
        "id": context,
        "label": _text(language, config["label_ru"], config["label_en"]),
        "percent": percent,
        "note": _text(language, config["note_ru"], config["note_en"]),
        "categories": ordered,
    }


def _avg(by_id: dict[str, dict[str, Any]], keys: list[str]) -> int:
    return round(sum(by_id[key]["percent"] for key in keys) / len(keys))


def _weighted_percent(by_id: dict[str, dict[str, Any]], keys: list[str]) -> int:
    max_total = sum(by_id[key]["max"] for key in keys)
    if not max_total:
        return 0
    score_total = sum(by_id[key]["score"] for key in keys)
    return round(score_total / max_total * 100)


def _build_flags(kuta: list[dict[str, Any]], mangal: dict[str, Any], language: str) -> list[dict[str, str]]:
    flags = []
    by_trad = {item["traditional_key"]: item for item in kuta}
    if by_trad["nadi"]["score"] == 0:
        flags.append({"level": "high", "text": _text(language, "Нужна внимательная проверка темы здоровья и семьи.", "Health and family harmony need careful review.")})
    if by_trad["bhakoot"]["score"] == 0:
        flags.append({"level": "high", "text": _text(language, "Есть риск разного жизненного вектора в долгих отношениях.", "Long-term life direction may diverge.")})
    if mangal["status"] == "mismatch":
        flags.append({"level": "medium", "text": mangal["message"]})
    if not flags:
        flags.append({"level": "good", "text": _text(language, "Критических несовпадений в базовой проверке нет.", "No critical mismatch in the base check.")})
    return flags


def _mangal_message(profile_a: dict[str, Any], profile_b: dict[str, Any], language: str) -> str:
    if profile_a["has_dosha"] == profile_b["has_dosha"]:
        return _text(language, "Уровень конфликтности у пары сбалансирован.", "The conflict pattern is balanced between the pair.")
    return _text(language, "У одного партнёра сильнее выражен импульсивный конфликтный паттерн.", "One partner has a stronger impulsive conflict pattern.")


def _score_label(percent: int, language: str) -> str:
    if percent >= 78:
        return _text(language, "очень высокая", "very high")
    if percent >= 62:
        return _text(language, "хорошая", "good")
    if percent >= 50:
        return _text(language, "смешанная", "mixed")
    return _text(language, "сложная", "challenging")


def _summary(
    percent: int,
    points: float,
    flags: list[dict[str, str]],
    language: str,
    context_view: dict[str, Any] | None = None,
) -> str:
    risk_count = sum(1 for flag in flags if flag["level"] in {"high", "medium"})
    context_label = context_view.get("label") if context_view else None
    context_percent = context_view.get("percent") if context_view else percent
    if risk_count:
        return _text(
            language,
            f"Индекс {points:g}/36. Для режима «{context_label}» оценка {context_percent}%. Совместимость есть, но важны обозначенные зоны риска.",
            f"Index {points:g}/36. For {context_label}, the rating is {context_percent}%. Compatibility is present, but the flagged risk areas matter.",
        )
    return _text(
        language,
        f"Индекс {points:g}/36. Для режима «{context_label}» оценка {context_percent}%. Базовая совместимость выглядит устойчиво.",
        f"Index {points:g}/36. For {context_label}, the rating is {context_percent}%. Base compatibility looks stable.",
    )


def _text(language: str, ru: str, en: str) -> str:
    return ru if language == "ru" else en
