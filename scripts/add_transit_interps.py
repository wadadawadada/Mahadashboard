"""Add transit interpretation entries to interpretations.jsonl."""
import json
from pathlib import Path

PATH = Path(__file__).parent.parent / "data" / "knowledge" / "interpretations.jsonl"

SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo",
         "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"]
SIGNS_RU = {"Aries":"Овен","Taurus":"Телец","Gemini":"Близнецы","Cancer":"Рак",
            "Leo":"Лев","Virgo":"Дева","Libra":"Весы","Scorpio":"Скорпион",
            "Sagittarius":"Стрелец","Capricorn":"Козерог","Aquarius":"Водолей","Pisces":"Рыбы"}
PLANETS = ["sun","moon","mars","mercury","jupiter","venus","saturn","rahu","ketu"]
PLANETS_RU_GEN = {"sun":"Солнца","moon":"Луны","mars":"Марса","mercury":"Меркурия",
                  "jupiter":"Юпитера","venus":"Венеры","saturn":"Сатурна",
                  "rahu":"Раху","ketu":"Кету"}
PLANETS_EN = {p: p.capitalize() for p in PLANETS}

HOUSE_EN = {
    1:"identity and body", 2:"wealth and speech", 3:"courage and communication",
    4:"home and emotions", 5:"intelligence and creativity", 6:"health and service",
    7:"relationships and partnerships", 8:"transformation and hidden matters",
    9:"dharma and fortune", 10:"career and status", 11:"gains and networks",
    12:"loss and spirituality",
}
HOUSE_RU = {
    1:"идентичность и тело", 2:"богатство и речь", 3:"смелость и коммуникации",
    4:"дом и эмоции", 5:"интеллект и творчество", 6:"здоровье и служение",
    7:"отношения и партнёрства", 8:"трансформация и скрытое",
    9:"дхарма и удача", 10:"карьера и статус", 11:"достижения и связи",
    12:"потери и духовность",
}

PLANET_THEME_EN = {
    "sun":     "leadership, identity, vitality, father figures",
    "moon":    "mind, emotions, habits, mother, public life",
    "mars":    "energy, conflict, initiative, siblings, property",
    "mercury": "intellect, communication, trade, nervous system",
    "jupiter": "wisdom, expansion, law, children, wealth",
    "venus":   "pleasure, relationships, beauty, art, luxury",
    "saturn":  "discipline, delay, karma, hard work, longevity",
    "rahu":    "ambition, disruption, foreign influence, unconventional paths",
    "ketu":    "detachment, spirituality, past-life residue, separation",
}
PLANET_THEME_RU = {
    "sun":     "лидерство, идентичность, жизненная сила, отцовские фигуры",
    "moon":    "ум, эмоции, привычки, мать, публичная жизнь",
    "mars":    "энергия, конфликт, инициатива, братья и сёстры, недвижимость",
    "mercury": "интеллект, коммуникация, торговля, нервная система",
    "jupiter": "мудрость, расширение, закон, дети, богатство",
    "venus":   "удовольствие, отношения, красота, искусство, роскошь",
    "saturn":  "дисциплина, задержки, карма, упорный труд, долголетие",
    "rahu":    "амбиции, разрушение привычного, иностранное влияние, нестандартные пути",
    "ketu":    "отстранённость, духовность, кармический след прошлых жизней, разделение",
}

GOOD_HOUSES = {3, 6, 10, 11}
BAD_HOUSES = {6, 8, 12}

# Load existing keys to avoid duplicates
existing_keys: set[str] = set()
with open(PATH, encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if line:
            obj = json.loads(line)
            existing_keys.add(obj["key"])

new_entries = []

# transit:planet:sign:X
for p in PLANETS:
    for sign in SIGNS:
        sign_key = sign.lower().replace(" ", "_")
        key = f"transit:{p}:sign:{sign_key}"
        if key in existing_keys:
            continue
        sign_ru = SIGNS_RU[sign]
        planet_ru_gen = PLANETS_RU_GEN[p]
        theme_en = PLANET_THEME_EN[p]
        theme_ru = PLANET_THEME_RU[p]
        new_entries.append({
            "key": key,
            "source_id": "curated:transit:basic",
            "text_en": (f"{PLANETS_EN[p]} transiting {sign}: themes of {theme_en} "
                        f"are activated through the energy of {sign}."),
            "text_ru": (f"Транзит {planet_ru_gen} через {sign_ru}: темы {theme_ru} "
                        f"активируются через энергию знака {sign_ru}."),
        })

# transit:planet:house:N
for p in PLANETS:
    for h in range(1, 13):
        key = f"transit:{p}:house:{h}"
        if key in existing_keys:
            continue
        house_en = HOUSE_EN[h]
        house_ru = HOUSE_RU[h]
        planet_ru_gen = PLANETS_RU_GEN[p]
        if h in GOOD_HOUSES:
            quality_en = "favorable"
            quality_ru = "благоприятный"
        elif h in BAD_HOUSES:
            quality_en = "challenging"
            quality_ru = "сложный"
        else:
            quality_en = "activating"
            quality_ru = "активирующий"
        new_entries.append({
            "key": key,
            "source_id": "curated:transit:basic",
            "text_en": (f"{PLANETS_EN[p]} transiting house {h} ({house_en}): "
                        f"a {quality_en} transit activating this life area."),
            "text_ru": (f"Транзит {planet_ru_gen} через {h}-й дом ({house_ru}): "
                        f"{quality_ru} транзит, активирующий эту сферу жизни."),
        })

# transit:planet:dignity:exalted / debilitated
for p in PLANETS:
    for dig in ("exalted", "debilitated"):
        key = f"transit:{p}:dignity:{dig}"
        if key in existing_keys:
            continue
        planet_en = PLANETS_EN[p]
        planet_ru_gen = PLANETS_RU_GEN[p]
        if dig == "exalted":
            new_entries.append({
                "key": key,
                "source_id": "curated:transit:basic",
                "text_en": (f"{planet_en} is exalted during this transit — maximum planetary strength. "
                            f"Its significations are powerfully supported."),
                "text_ru": (f"{planet_en} в экзальтации во время транзита — максимальная сила планеты. "
                            f"Её сигнификации мощно поддержаны."),
            })
        else:
            new_entries.append({
                "key": key,
                "source_id": "curated:transit:basic",
                "text_en": (f"{planet_en} is debilitated during this transit — weakened planetary energy. "
                            f"Extra care is needed in its domains."),
                "text_ru": (f"{planet_en} в падении во время транзита — ослабленная энергия планеты. "
                            f"В её сферах требуется особая внимательность."),
            })

with open(PATH, "a", encoding="utf-8") as f:
    for entry in new_entries:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")

print(f"Added {len(new_entries)} transit interpretation entries")
