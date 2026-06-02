"""Part 6: aspect:planet:Nth + aspect:planet:Nth:house:N + dasha:maha:antar combos"""
import json, pathlib

DATA = []
SOURCE = "curated:jyotish:basic"

PLANETS = ["sun","moon","mars","mercury","jupiter","venus","saturn","rahu","ketu"]

PLANET_LABEL_EN = {
    "sun":"The Sun","moon":"The Moon","mars":"Mars","mercury":"Mercury",
    "jupiter":"Jupiter","venus":"Venus","saturn":"Saturn","rahu":"Rahu","ketu":"Ketu",
}
PLANET_LABEL_RU = {
    "sun":"Солнце","moon":"Луна","mars":"Марс","mercury":"Меркурий",
    "jupiter":"Юпитер","venus":"Венера","saturn":"Сатурн","rahu":"Раху","ketu":"Кету",
}

# Aspect offsets by planet (standard Jyotish)
PLANET_ASPECTS = {
    "sun":     [7],
    "moon":    [7],
    "mars":    [4, 7, 8],
    "mercury": [7],
    "jupiter": [5, 7, 9],
    "venus":   [7],
    "saturn":  [3, 7, 10],
    "rahu":    [5, 7, 9],
    "ketu":    [5, 7, 9],
}

OFFSET_MEANING_EN = {
    2:  "2nd-house aspect",
    3:  "3rd-house aspect (Saturn special): themes of courage, communication and short endeavors.",
    4:  "4th-house aspect (Mars special): themes of home, property and emotional foundation.",
    5:  "5th-house aspect (Jupiter/Rahu/Ketu special): themes of creativity, children and intelligence.",
    6:  "6th-house aspect: themes of service, health, obstacles and competition.",
    7:  "7th-house aspect (universal opposition): themes of partnerships, public dealings and direct confrontation.",
    8:  "8th-house aspect (Mars special): themes of transformation, hidden matters and sudden change.",
    9:  "9th-house aspect (Jupiter/Rahu/Ketu special): themes of dharma, father, fortune and higher wisdom.",
    10: "10th-house aspect (Saturn special): themes of career, authority and public achievement.",
}
OFFSET_MEANING_RU = {
    2:  "аспект 2-го дома",
    3:  "аспект 3-го дома (особый аспект Сатурна): темы смелости, коммуникации и ближних начинаний.",
    4:  "аспект 4-го дома (особый аспект Марса): темы дома, собственности и эмоциональной основы.",
    5:  "аспект 5-го дома (особый аспект Юпитера/Раху/Кету): темы творчества, детей и интеллекта.",
    6:  "аспект 6-го дома: темы служения, здоровья, препятствий и конкуренции.",
    7:  "аспект 7-го дома (универсальная оппозиция): темы партнёрств, публичных дел и прямого противостояния.",
    8:  "аспект 8-го дома (особый аспект Марса): темы трансформации, скрытых дел и внезапных перемен.",
    9:  "аспект 9-го дома (особый аспект Юпитера/Раху/Кету): темы дхармы, отца, удачи и высшей мудрости.",
    10: "аспект 10-го дома (особый аспект Сатурна): темы карьеры, авторитета и публичных достижений.",
}

HOUSE_DOMAIN_EN = {
    1:"self and personality",2:"family and wealth",3:"courage and communication",
    4:"home and happiness",5:"intelligence and children",6:"enemies and health",
    7:"partnerships and marriage",8:"transformation and hidden matters",
    9:"dharma and fortune",10:"career and authority",11:"gains and desires",12:"liberation and foreign lands",
}
HOUSE_DOMAIN_RU = {
    1:"личность",2:"семья и богатство",3:"смелость и общение",
    4:"дом и счастье",5:"интеллект и дети",6:"враги и здоровье",
    7:"партнёрства и брак",8:"трансформация и скрытые дела",
    9:"дхарма и удача",10:"карьера и авторитет",11:"прибыли и желания",12:"освобождение и чужие земли",
}

# ── aspect:planet:Nth and aspect:planet:Nth:house:N ──────────────────────────
# Generate all offsets 2–12 for all planets (chart uses positional offset)
ALL_OFFSETS = list(range(2, 13))

for planet in PLANETS:
    for offset in ALL_OFFSETS:
        key = f"aspect:{planet}:{offset}th"
        meaning_en = OFFSET_MEANING_EN.get(offset, f"{offset}th positional aspect.")
        meaning_ru = OFFSET_MEANING_RU.get(offset, f"позиционный аспект {offset}-го дома.")
        en = f"{PLANET_LABEL_EN[planet]} casts a {offset}th positional aspect. {meaning_en} This planet's significations influence the aspected house."
        ru = f"{PLANET_LABEL_RU[planet]} бросает позиционный аспект {offset}-го дома. {meaning_ru} Значения этой планеты влияют на аспектируемый дом."
        DATA.append({"key": key, "source_id": SOURCE, "text_en": en, "text_ru": ru})

        for to_house in range(1, 13):
            key2 = f"aspect:{planet}:{offset}th:house:{to_house}"
            domain_en = HOUSE_DOMAIN_EN[to_house]
            domain_ru = HOUSE_DOMAIN_RU[to_house]
            en2 = (f"{PLANET_LABEL_EN[planet]}'s {offset}th aspect falls on house {to_house} ({domain_en}). "
                   f"This planet's themes permeate the area of {domain_en}.")
            ru2 = (f"Позиционный аспект {offset}-го дома {PLANET_LABEL_RU[planet]} падает на {to_house}-й дом ({domain_ru}). "
                   f"Темы этой планеты проникают в область {domain_ru}.")
            DATA.append({"key": key2, "source_id": SOURCE, "text_en": en2, "text_ru": ru2})

# ── dasha:maha:antar combos (all 9x9 = 81) ────────────────────────────────────
DASHA_PLANET_EN = {
    "sun":"Sun","moon":"Moon","mars":"Mars","mercury":"Mercury","jupiter":"Jupiter",
    "venus":"Venus","saturn":"Saturn","rahu":"Rahu","ketu":"Ketu",
}
DASHA_PLANET_RU = {
    "sun":"Солнца","moon":"Луны","mars":"Марса","mercury":"Меркурия","jupiter":"Юпитера",
    "venus":"Венеры","saturn":"Сатурна","rahu":"Раху","ketu":"Кету",
}

for maha in PLANETS:
    for antar in PLANETS:
        key = f"dasha:{maha}:{antar}"
        en = (f"{DASHA_PLANET_EN[maha]}-{DASHA_PLANET_EN[antar]} period: "
              f"the {DASHA_PLANET_EN[antar]} antardasha runs within the {DASHA_PLANET_EN[maha]} mahadasha. "
              f"The sub-period quality blends {DASHA_PLANET_EN[antar]}'s significations into the overarching {DASHA_PLANET_EN[maha]} themes. "
              f"Results depend on both planets' signs, houses, nakshatras and mutual relationship.")
        ru = (f"Период {DASHA_PLANET_RU[maha]}-{DASHA_PLANET_RU[antar]}: "
              f"антардаша {DASHA_PLANET_RU[antar]} протекает внутри махадаши {DASHA_PLANET_RU[maha]}. "
              f"Качество подпериода смешивает значения {DASHA_PLANET_RU[antar]} с общими темами {DASHA_PLANET_RU[maha]}. "
              f"Результаты зависят от знаков, домов, накшатр и взаимных отношений обеих планет.")
        DATA.append({"key": key, "source_id": SOURCE, "text_en": en, "text_ru": ru})

out = pathlib.Path(__file__).parent / "part6_aspects_dashas.jsonl"
with open(out, "w", encoding="utf-8") as f:
    for entry in DATA:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
print(f"Written {len(DATA)} entries to {out}")
