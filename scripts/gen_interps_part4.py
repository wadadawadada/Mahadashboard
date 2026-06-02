"""Part 4: planet:nakshatra:pada (9 x 27 x 4 = 972 entries)"""
import json, pathlib

DATA = []
SOURCE = "curated:jyotish:basic"

# Pada themes — each pada corresponds to a navamsa sign in sequence
# Fire signs start: pada 1=Aries, 2=Taurus, 3=Gemini, 4=Cancer (fire nakshatras)
# etc. The universal pada meanings by number:
PADA_EN = {
    1: "First pada falls in the navamsa of a fire sign, emphasizing initiative, identity and new beginnings.",
    2: "Second pada falls in the navamsa of an earth sign, bringing material focus, stability and tangible results.",
    3: "Third pada falls in the navamsa of an air sign, adding intellectual quality, communication and social dimension.",
    4: "Fourth pada falls in the navamsa of a water sign, deepening emotional resonance, intuition and karmic depth.",
}
PADA_RU = {
    1: "Первая пада попадает в навамшу огненного знака, подчёркивая инициативу, идентичность и новые начала.",
    2: "Вторая пада попадает в навамшу земного знака, привнося материальный фокус, стабильность и ощутимые результаты.",
    3: "Третья пада попадает в навамшу воздушного знака, добавляя интеллектуальное качество, общение и социальное измерение.",
    4: "Четвёртая пада попадает в навамшу водного знака, углубляя эмоциональный резонанс, интуицию и кармическую глубину.",
}

NK_SHORT_EN = {
    "ashwini": "speed and healing", "bharani": "containment and consequence",
    "krittika": "purifying fire", "rohini": "beauty and abundance",
    "mrigashira": "searching and curiosity", "ardra": "storm and intensity",
    "punarvasu": "renewal and restoration", "pushya": "nourishment and protection",
    "ashlesha": "serpent wisdom", "magha": "royal legacy",
    "purva_phalguni": "pleasure and rest", "uttara_phalguni": "duty and friendship",
    "hasta": "skilled craft", "chitra": "beauty and form",
    "swati": "independence and trade", "vishakha": "determined ambition",
    "anuradha": "devotion and loyalty", "jyeshtha": "seniority and authority",
    "mula": "root investigation", "purva_ashadha": "early victory",
    "uttara_ashadha": "lasting righteousness", "shravana": "listening and learning",
    "dhanishta": "wealth and rhythm", "shatabhisha": "healing mystery",
    "purva_bhadrapada": "intense purification", "uttara_bhadrapada": "deep wisdom",
    "revati": "gentle completion",
}
NK_SHORT_RU = {
    "ashwini": "скорость и исцеление", "bharani": "сдерживание и последствия",
    "krittika": "очищающий огонь", "rohini": "красота и изобилие",
    "mrigashira": "поиск и любопытство", "ardra": "буря и интенсивность",
    "punarvasu": "обновление и восстановление", "pushya": "питание и защита",
    "ashlesha": "мудрость змея", "magha": "королевское наследие",
    "purva_phalguni": "удовольствие и отдых", "uttara_phalguni": "долг и дружба",
    "hasta": "умелое ремесло", "chitra": "красота и форма",
    "swati": "независимость и торговля", "vishakha": "целеустремлённое честолюбие",
    "anuradha": "преданность и верность", "jyeshtha": "старшинство и авторитет",
    "mula": "исследование первопричин", "purva_ashadha": "ранняя победа",
    "uttara_ashadha": "непоколебимая праведность", "shravana": "слушание и обучение",
    "dhanishta": "богатство и ритм", "shatabhisha": "целительная тайна",
    "purva_bhadrapada": "интенсивное очищение", "uttara_bhadrapada": "глубокая мудрость",
    "revati": "мягкое завершение",
}

PLANET_LABEL_EN = {
    "sun": "Solar energy", "moon": "The mind", "mars": "Mars energy",
    "mercury": "Mercury", "jupiter": "Jupiter", "venus": "Venus",
    "saturn": "Saturn", "rahu": "Rahu", "ketu": "Ketu",
}
PLANET_LABEL_RU = {
    "sun": "Солнечная энергия", "moon": "Ум", "mars": "Энергия Марса",
    "mercury": "Меркурий", "jupiter": "Юпитер", "venus": "Венера",
    "saturn": "Сатурн", "rahu": "Раху", "ketu": "Кету",
}

PLANETS = ["sun","moon","mars","mercury","jupiter","venus","saturn","rahu","ketu"]
NAKSHATRAS = list(NK_SHORT_EN.keys())

for planet in PLANETS:
    for nk in NAKSHATRAS:
        for pada in range(1, 5):
            nk_display = nk.replace("_", " ").title()
            en = (
                f"{PLANET_LABEL_EN[planet]} in {nk_display} pada {pada}: "
                f"themes of {NK_SHORT_EN[nk]}. "
                f"{PADA_EN[pada]}"
            )
            ru = (
                f"{PLANET_LABEL_RU[planet]} в {nk_display} пада {pada}: "
                f"темы {NK_SHORT_RU[nk]}. "
                f"{PADA_RU[pada]}"
            )
            DATA.append({
                "key": f"planet:{planet}:nakshatra:{nk}:pada:{pada}",
                "source_id": SOURCE,
                "text_en": en,
                "text_ru": ru,
            })

out = pathlib.Path(__file__).parent / "part4_planet_nakshatra_pada.jsonl"
with open(out, "w", encoding="utf-8") as f:
    for entry in DATA:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
print(f"Written {len(DATA)} entries to {out}")
