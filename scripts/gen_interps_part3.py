"""Part 3: planet:nakshatra (9 planets x 27 nakshatras = 243 entries)"""
import json, pathlib

DATA = []
SOURCE = "curated:jyotish:basic"

# nakshatra themes for combining with planet meanings
NK_THEMES = {
    "ashwini":           ("speed, healing, fresh starts, divine physicians, impulse", "скорость, исцеление, новые начала, божественные целители, импульсивность"),
    "bharani":           ("containment, moral consequence, transformation, fertility, Yama", "сдерживание, нравственные последствия, трансформация, плодородие, Яма"),
    "krittika":          ("cutting, purification, sharp focus, fire, determination", "рассечение, очищение, острый фокус, огонь, решительность"),
    "rohini":            ("fertility, beauty, abundance, creativity, sensuality, Brahma", "плодородие, красота, изобилие, творчество, чувственность, Брахма"),
    "mrigashira":        ("searching, curiosity, gentleness, seeking, travel, restlessness", "поиск, любопытство, мягкость, странствие, беспокойная природа"),
    "ardra":             ("intense mental activity, storm, grief turned to growth, Rudra", "интенсивная умственная активность, буря, горе превращающееся в рост, Рудра"),
    "punarvasu":         ("renewal, restoration, optimism, abundance, philosophical thinking", "обновление, восстановление, оптимизм, изобилие, философское мышление"),
    "pushya":            ("nourishment, protection, spiritual growth, devotion, auspiciousness", "питание, защита, духовный рост, преданность, благоприятность"),
    "ashlesha":          ("clinging, serpent wisdom, kundalini, intense perception, adversity", "цепляние, мудрость змея, кундалини, острое восприятие, испытания"),
    "magha":             ("royalty, ancestral legacy, pride, authority, lineage", "царственность, наследие предков, гордость, авторитет, родословная"),
    "purva_phalguni":    ("pleasure, rest, creative enjoyment, marital happiness, Bhaga", "удовольствие, отдых, творческое наслаждение, семейное счастье, Бхага"),
    "uttara_phalguni":   ("friendship, patronage, duty, reliability, generous giving", "дружба, покровительство, долг, надёжность, щедрая отдача"),
    "hasta":             ("skilled hands, craft, wit, humor, resourcefulness", "умелые руки, ремесло, остроумие, юмор, находчивость"),
    "chitra":            ("beauty, creativity, architecture, illusion, perfecting form", "красота, творчество, архитектура, иллюзия, совершенствование формы"),
    "swati":             ("independence, flexibility, trade, diplomacy, freedom, wind", "независимость, гибкость, торговля, дипломатия, свобода, ветер"),
    "vishakha":          ("determined goal-seeking, ambition, triumph, forceful will", "целеустремлённость, честолюбие, торжество, мощная воля"),
    "anuradha":          ("devotion, organization, loyalty, friendship, working with others", "преданность, организованность, верность, дружба, работа с другими"),
    "jyeshtha":          ("seniority, authority, responsibility, protection, power, burden", "старшинство, авторитет, ответственность, защита, власть, бремя"),
    "mula":              ("investigation, root causes, upheaval, search for truth, dissolution", "исследование, первопричины, потрясение, поиск истины, растворение"),
    "purva_ashadha":     ("invincibility, purification, early victories, pride, gathering", "непобедимость, очищение, ранние победы, гордость, собирание сил"),
    "uttara_ashadha":    ("lasting victory, righteousness, persistence, unwavering dharma", "устойчивая победа, праведность, настойчивость, непоколебимая дхарма"),
    "shravana":          ("listening, learning, connection across distance, preservation, pilgrimage", "слушание, обучение, связь на расстоянии, сохранение, паломничество"),
    "dhanishta":         ("wealth, fame, music, rhythm, abundance, group support", "богатство, слава, музыка, ритм, изобилие, групповая поддержка"),
    "shatabhisha":       ("healing, mystery, research, isolation, hidden knowledge, Varuna", "исцеление, тайна, исследование, уединение, скрытое знание, Варуна"),
    "purva_bhadrapada":  ("intense purification, fire, austerity, transformation, one-footed goat", "интенсивное очищение, огонь, аскетизм, трансформация, однокопытный козёл"),
    "uttara_bhadrapada": ("depth, stability, wisdom, compassion, endurance, serpent of the deep", "глубина, стабильность, мудрость, сострадание, выносливость, змей глубин"),
    "revati":            ("safe journeys, nourishment, completion, protection, gentle abundance", "безопасные путешествия, питание, завершение, защита, мягкое изобилие"),
}

PLANET_NK_TEMPLATE = {
    "sun":     ("Sun in {nk} — solar identity and authority expressed through {themes_en}. Leadership and vitality colored by this nakshatra's essence.",
                "Солнце в {nk} — солярная идентичность и авторитет выражаются через {themes_ru}. Лидерство и витальность окрашены сущностью этой накшатры."),
    "moon":    ("Moon in {nk} — emotional mind and memory shaped by {themes_en}. Receptivity and nurturing influenced by this nakshatra's quality.",
                "Луна в {nk} — эмоциональный ум и память формируются через {themes_ru}. Восприимчивость и забота пронизаны качеством этой накшатры."),
    "mars":    ("Mars in {nk} — energy and will expressed through {themes_en}. Action and courage take on this nakshatra's character.",
                "Марс в {nk} — энергия и воля выражаются через {themes_ru}. Действие и мужество принимают характер этой накшатры."),
    "mercury": ("Mercury in {nk} — intellect and communication colored by {themes_en}. Analytical and verbal skills shaped by this nakshatra.",
                "Меркурий в {nk} — интеллект и коммуникация окрашены {themes_ru}. Аналитические и речевые способности формируются этой накшатрой."),
    "jupiter": ("Jupiter in {nk} — wisdom and expansion channeled through {themes_en}. Dharma and teaching shaped by this nakshatra's domain.",
                "Юпитер в {nk} — мудрость и расширение направляются через {themes_ru}. Дхарма и преподавание формируются областью этой накшатры."),
    "venus":   ("Venus in {nk} — love and beauty expressed through {themes_en}. Pleasure and relationship colored by this nakshatra.",
                "Венера в {nk} — любовь и красота выражаются через {themes_ru}. Удовольствие и отношения окрашены этой накшатрой."),
    "saturn":  ("Saturn in {nk} — discipline and endurance directed through {themes_en}. Karmic work shaped by this nakshatra's domain.",
                "Сатурн в {nk} — дисциплина и выносливость направляются через {themes_ru}. Кармическая работа формируется областью этой накшатры."),
    "rahu":    ("Rahu in {nk} — amplified desire and disruption through {themes_en}. Obsessive drives colored by this nakshatra's energy.",
                "Раху в {nk} — усиленное желание и нарушение через {themes_ru}. Навязчивые стремления окрашены энергией этой накшатры."),
    "ketu":    ("Ketu in {nk} — past-life mastery and detachment through {themes_en}. Karmic release and sharp perception shaped by this nakshatra.",
                "Кету в {nk} — мастерство прошлых жизней и отстранённость через {themes_ru}. Кармическое освобождение и острое восприятие формируются этой накшатрой."),
}

PLANETS = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu"]

for planet in PLANETS:
    tmpl_en, tmpl_ru = PLANET_NK_TEMPLATE[planet]
    for nk, (themes_en, themes_ru) in NK_THEMES.items():
        nk_display = nk.replace("_", " ").title()
        en = tmpl_en.format(nk=nk_display, themes_en=themes_en)
        ru = tmpl_ru.format(nk=nk_display, themes_ru=themes_ru)
        DATA.append({
            "key": f"planet:{planet}:nakshatra:{nk}",
            "source_id": SOURCE,
            "text_en": en,
            "text_ru": ru,
        })

out = pathlib.Path(__file__).parent / "part3_planet_nakshatra.jsonl"
with open(out, "w", encoding="utf-8") as f:
    for entry in DATA:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
print(f"Written {len(DATA)} entries to {out}")
