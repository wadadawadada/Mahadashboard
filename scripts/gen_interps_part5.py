"""Part 5: lagna:nakshatra + lagna:nakshatra:pada + d9:planet:sign + house:N + house:N:sign + house:N:lord"""
import json, pathlib

DATA = []
SOURCE = "curated:jyotish:basic"

# ── lagna:nakshatra ──────────────────────────────────────────────────────────
NK_LAGNA = {
    "ashwini":           ("Ashwini Lagna nakshatra — ascendant colored by speed, healing, Ketu rulership and the divine physicians. Fresh starts, impulse and vitality shape the life direction.",
                          "Накшатра лагны Ашвини — асцендент окрашен скоростью, исцелением, управлением Кету и небесными целителями. Новые начала, импульсивность и витальность формируют жизненный путь."),
    "bharani":           ("Bharani Lagna nakshatra — ascendant shaped by containment, moral consequence and Venus rulership. Themes of transformation, pressure and fertility define the life path.",
                          "Накшатра лагны Бхарани — асцендент формируется сдерживанием, нравственными последствиями и управлением Венеры. Темы трансформации, давления и плодородия определяют жизненный путь."),
    "krittika":          ("Krittika Lagna nakshatra — Sun-ruled; ascendant of purifying fire, sharp focus, cutting clarity and determination. The native burns away impurities in life.",
                          "Накшатра лагны Криттика — управляется Солнцем; асцендент очищающего огня, острого фокуса, рассекающей ясности и решительности. Уроженец сжигает несущественное в жизни."),
    "rohini":            ("Rohini Lagna nakshatra — Moon-ruled; ascendant of fertility, beauty, creativity and sensual abundance. The native attracts material manifestation and deep affection.",
                          "Накшатра лагны Рохини — управляется Луной; асцендент плодородия, красоты, творчества и чувственного изобилия. Уроженец притягивает материальное воплощение и глубокую привязанность."),
    "mrigashira":        ("Mrigashira Lagna nakshatra — Mars-ruled; ascendant of searching, curiosity and gentle seeking. The native has a restless, questing nature and travels widely.",
                          "Накшатра лагны Мригашира — управляется Марсом; асцендент поиска, любопытства и мягкого искания. Уроженец обладает беспокойной, ищущей натурой и много путешествует."),
    "ardra":             ("Ardra Lagna nakshatra — Rahu-ruled; ascendant of storm, intense mental activity and transformation through grief. Growth emerges through upheaval.",
                          "Накшатра лагны Ардра — управляется Раху; асцендент бури, интенсивной умственной активности и трансформации через горе. Рост возникает через потрясение."),
    "punarvasu":         ("Punarvasu Lagna nakshatra — Jupiter-ruled; ascendant of renewal, restoration and philosophical optimism. The native returns from adversity with expanded understanding.",
                          "Накшатра лагны Пунарвасу — управляется Юпитером; асцендент обновления, восстановления и философского оптимизма. Уроженец возвращается из испытаний с расширенным пониманием."),
    "pushya":            ("Pushya Lagna nakshatra — Saturn-ruled; ascendant of nourishment, protection and spiritual auspiciousness. The native is naturally devoted and protective of others.",
                          "Накшатра лагны Пушья — управляется Сатурном; асцендент питания, защиты и духовной благоприятности. Уроженец по природе предан и защищает других."),
    "ashlesha":          ("Ashlesha Lagna nakshatra — Mercury-ruled; ascendant of serpent wisdom, clinging perception and kundalini themes. The native has penetrating intelligence.",
                          "Накшатра лагны Ашлеша — управляется Меркурием; асцендент мудрости змея, цепкого восприятия и тем кундалини. Уроженец обладает проникающим интеллектом."),
    "magha":             ("Magha Lagna nakshatra — Ketu-ruled; ascendant of royal authority, ancestral pride and lineage. The native carries a regal bearing and deep connection to ancestors.",
                          "Накшатра лагны Магха — управляется Кету; асцендент королевского авторитета, родовой гордости и родословной. Уроженец несёт царственную осанку и глубокую связь с предками."),
    "purva_phalguni":    ("Purva Phalguni Lagna nakshatra — Venus-ruled; ascendant of pleasure, creative enjoyment and marital happiness. The native values beauty and comfort deeply.",
                          "Накшатра лагны Пурва Пхальгуни — управляется Венерой; асцендент удовольствия, творческого наслаждения и семейного счастья. Уроженец глубоко ценит красоту и комфорт."),
    "uttara_phalguni":   ("Uttara Phalguni Lagna nakshatra — Sun-ruled; ascendant of friendship, duty and reliable giving. The native is generous, dependable and valued in community.",
                          "Накшатра лагны Уттара Пхальгуни — управляется Солнцем; асцендент дружбы, долга и надёжной отдачи. Уроженец щедрый, надёжный и ценимый в обществе."),
    "hasta":             ("Hasta Lagna nakshatra — Moon-ruled; ascendant of skilled hands, craft, wit and resourcefulness. The native excels in practical intelligence and manual dexterity.",
                          "Накшатра лагны Хаста — управляется Луной; асцендент умелых рук, ремесла, остроумия и находчивости. Уроженец отличается практическим интеллектом и ручной сноровкой."),
    "chitra":            ("Chitra Lagna nakshatra — Mars-ruled; ascendant of beauty, architecture and the drive to perfect form. The native is aesthetically gifted and detail-oriented.",
                          "Накшатра лагны Читра — управляется Марсом; асцендент красоты, архитектуры и стремления к совершенству формы. Уроженец эстетически одарён и ориентирован на детали."),
    "swati":             ("Swati Lagna nakshatra — Rahu-ruled; ascendant of independence, flexibility and freedom. The native is diplomatic, trade-minded and moves like the wind.",
                          "Накшатра лагны Свати — управляется Раху; асцендент независимости, гибкости и свободы. Уроженец дипломатичен, ориентирован на торговлю и движется подобно ветру."),
    "vishakha":          ("Vishakha Lagna nakshatra — Jupiter-ruled; ascendant of determined goal-seeking and forceful will. The native triumphs through sustained ambition and purpose.",
                          "Накшатра лагны Вишакха — управляется Юпитером; асцендент целеустремлённого поиска и мощной воли. Уроженец торжествует через устойчивое честолюбие и целеустремлённость."),
    "anuradha":          ("Anuradha Lagna nakshatra — Saturn-ruled; ascendant of devotion, organization and loyalty. The native builds lasting bonds through steady commitment.",
                          "Накшатра лагны Анурадха — управляется Сатурном; асцендент преданности, организованности и верности. Уроженец строит прочные связи через устойчивую преданность."),
    "jyeshtha":          ("Jyeshtha Lagna nakshatra — Mercury-ruled; ascendant of seniority, authority and the weight of protection. The native carries responsibility and wields quiet power.",
                          "Накшатра лагны Джйештха — управляется Меркурием; асцендент старшинства, авторитета и бремени защиты. Уроженец несёт ответственность и обладает тихой властью."),
    "mula":              ("Mula Lagna nakshatra — Ketu-ruled; ascendant of investigation and uprooting. The native is driven to find root causes and truth, often through upheaval.",
                          "Накшатра лагны Мула — управляется Кету; асцендент исследования и вырывания с корнем. Уроженец стремится найти первопричины и истину, часто через потрясение."),
    "purva_ashadha":     ("Purva Ashadha Lagna nakshatra — Venus-ruled; ascendant of invincibility, purification and early victories. The native has pride and the power to gather support.",
                          "Накшатра лагны Пурва Ашадха — управляется Венерой; асцендент непобедимости, очищения и ранних побед. Уроженец обладает гордостью и способностью собирать поддержку."),
    "uttara_ashadha":    ("Uttara Ashadha Lagna nakshatra — Sun-ruled; ascendant of lasting victory and unwavering dharma. The native persists righteously toward ultimate goals.",
                          "Накшатра лагны Уттара Ашадха — управляется Солнцем; асцендент устойчивой победы и непоколебимой дхармы. Уроженец праведно стремится к конечным целям."),
    "shravana":          ("Shravana Lagna nakshatra — Moon-ruled; ascendant of listening, learning and connection. The native preserves knowledge and maintains sacred links across distance.",
                          "Накшатра лагны Шравана — управляется Луной; асцендент слушания, обучения и связи. Уроженец сохраняет знание и поддерживает священные связи на расстоянии."),
    "dhanishta":         ("Dhanishta Lagna nakshatra — Mars-ruled; ascendant of wealth, fame and rhythm. The native advances with group support and has strong musical or rhythmic gifts.",
                          "Накшатра лагны Дхаништха — управляется Марсом; асцендент богатства, славы и ритма. Уроженец продвигается с групповой поддержкой и обладает сильными музыкальными или ритмическими дарованиями."),
    "shatabhisha":       ("Shatabhisha Lagna nakshatra — Rahu-ruled; ascendant of healing, mystery and hidden knowledge. The native is drawn to research, isolation and cosmic law.",
                          "Накшатра лагны Шатабхиша — управляется Раху; асцендент исцеления, тайны и скрытого знания. Уроженец тяготеет к исследованиям, уединению и космическому закону."),
    "purva_bhadrapada":  ("Purva Bhadrapada Lagna nakshatra — Jupiter-ruled; ascendant of intense purification and transformative austerity. The native's path involves deep inner fire.",
                          "Накшатра лагны Пурва Бхадрапада — управляется Юпитером; асцендент интенсивного очищения и преобразующего аскетизма. Путь уроженца включает глубокий внутренний огонь."),
    "uttara_bhadrapada": ("Uttara Bhadrapada Lagna nakshatra — Saturn-ruled; ascendant of depth, enduring wisdom and compassion. The native embodies stability rooted in serpentine hidden knowledge.",
                          "Накшатра лагны Уттара Бхадрапада — управляется Сатурном; асцендент глубины, устойчивой мудрости и сострадания. Уроженец воплощает стабильность, укоренённую в змеином скрытом знании."),
    "revati":            ("Revati Lagna nakshatra — Mercury-ruled; ascendant of safe journeys, nourishment and gentle completion. The native guides others toward wholeness.",
                          "Накшатра лагны Ревати — управляется Меркурием; асцендент безопасных путешествий, питания и мягкого завершения. Уроженец ведёт других к целостности."),
}

for nk, (en, ru) in NK_LAGNA.items():
    DATA.append({"key": f"lagna:nakshatra:{nk}", "source_id": SOURCE, "text_en": en, "text_ru": ru})

# ── lagna:nakshatra:pada ─────────────────────────────────────────────────────
PADA_EN = {
    1: "First pada of this nakshatra rises on the ascendant: fire-navamsa quality adds initiative and a strong sense of personal identity to the lagna.",
    2: "Second pada of this nakshatra rises on the ascendant: earth-navamsa quality adds practicality, material focus and steadiness to the lagna.",
    3: "Third pada of this nakshatra rises on the ascendant: air-navamsa quality adds intellectual curiosity, communicative skill and social orientation to the lagna.",
    4: "Fourth pada of this nakshatra rises on the ascendant: water-navamsa quality adds emotional depth, intuition and karmic sensitivity to the lagna.",
}
PADA_RU = {
    1: "Первая пада этой накшатры восходит на асцендент: качество огненной навамши добавляет инициативность и сильное чувство личной идентичности к лагне.",
    2: "Вторая пада этой накшатры восходит на асцендент: качество земной навамши добавляет практичность, материальный фокус и устойчивость к лагне.",
    3: "Третья пада этой накшатры восходит на асцендент: качество воздушной навамши добавляет интеллектуальное любопытство, коммуникативный навык и социальную ориентацию к лагне.",
    4: "Четвёртая пада этой накшатры восходит на асцендент: качество водной навамши добавляет эмоциональную глубину, интуицию и кармическую чувствительность к лагне.",
}
NK_SHORT = {k: v[0].split(" — ")[1].split(".")[0] for k, v in NK_LAGNA.items()}

for nk, (en_base, ru_base) in NK_LAGNA.items():
    nk_display = nk.replace("_", " ").title()
    for pada in range(1, 5):
        en = f"Lagna in {nk_display} pada {pada}. {PADA_EN[pada]}"
        ru = f"Лагна в {nk_display} пада {pada}. {PADA_RU[pada]}"
        DATA.append({"key": f"lagna:nakshatra:{nk}:pada:{pada}", "source_id": SOURCE, "text_en": en, "text_ru": ru})

# ── d9:planet:sign ───────────────────────────────────────────────────────────
D9_SIGN = {
    "aries":       ("In D9 navamsa, the soul's direction is colored by Aries: initiative, courage and independent self-expression at the deepest level.",
                    "В навамше D9 направление души окрашено Овном: инициатива, смелость и независимое самовыражение на глубочайшем уровне."),
    "taurus":      ("In D9 navamsa, the soul's direction is colored by Taurus: stability, sensory richness and material groundedness at the deepest level.",
                    "В навамше D9 направление души окрашено Тельцом: стабильность, чувственное богатство и материальная укоренённость на глубочайшем уровне."),
    "gemini":      ("In D9 navamsa, the soul's direction is colored by Gemini: intellect, adaptability and communicative versatility at the deepest level.",
                    "В навамше D9 направление души окрашено Близнецами: интеллект, адаптивность и коммуникативная разносторонность на глубочайшем уровне."),
    "cancer":      ("In D9 navamsa, the soul's direction is colored by Cancer: emotional depth, nurturing and devotion to home at the deepest level.",
                    "В навамше D9 направление души окрашено Раком: эмоциональная глубина, забота и преданность дому на глубочайшем уровне."),
    "leo":         ("In D9 navamsa, the soul's direction is colored by Leo: authority, creative pride and radiant self-expression at the deepest level.",
                    "В навамше D9 направление души окрашено Львом: авторитет, творческая гордость и лучистое самовыражение на глубочайшем уровне."),
    "virgo":       ("In D9 navamsa, the soul's direction is colored by Virgo: analytical precision, service and discernment at the deepest level.",
                    "В навамше D9 направление души окрашено Девой: аналитическая точность, служение и различение на глубочайшем уровне."),
    "libra":       ("In D9 navamsa, the soul's direction is colored by Libra: harmony, relationship and aesthetic balance at the deepest level.",
                    "В навамше D9 направление души окрашено Весами: гармония, партнёрство и эстетический баланс на глубочайшем уровне."),
    "scorpio":     ("In D9 navamsa, the soul's direction is colored by Scorpio: intensity, transformation and hidden mastery at the deepest level.",
                    "В навамше D9 направление души окрашено Скорпионом: интенсивность, трансформация и скрытое мастерство на глубочайшем уровне."),
    "sagittarius": ("In D9 navamsa, the soul's direction is colored by Sagittarius: wisdom, dharma and expansive philosophical truth at the deepest level.",
                    "В навамше D9 направление души окрашено Стрельцом: мудрость, дхарма и широкая философская истина на глубочайшем уровне."),
    "capricorn":   ("In D9 navamsa, the soul's direction is colored by Capricorn: disciplined ambition, structure and karmic duty at the deepest level.",
                    "В навамше D9 направление души окрашено Козерогом: дисциплинированное честолюбие, структура и кармический долг на глубочайшем уровне."),
    "aquarius":    ("In D9 navamsa, the soul's direction is colored by Aquarius: social idealism, innovation and humanitarian purpose at the deepest level.",
                    "В навамше D9 направление души окрашено Водолеем: социальный идеализм, инновации и гуманитарное призвание на глубочайшем уровне."),
    "pisces":      ("In D9 navamsa, the soul's direction is colored by Pisces: spiritual dissolution, compassion and mystical sensitivity at the deepest level.",
                    "В навамше D9 направление души окрашено Рыбами: духовное растворение, сострадание и мистическая чувствительность на глубочайшем уровне."),
}

PLANETS = ["sun","moon","mars","mercury","jupiter","venus","saturn","rahu","ketu"]
PLANET_LABEL_EN = {
    "sun": "The Sun", "moon": "The Moon", "mars": "Mars",
    "mercury": "Mercury", "jupiter": "Jupiter", "venus": "Venus",
    "saturn": "Saturn", "rahu": "Rahu", "ketu": "Ketu",
}
PLANET_LABEL_RU = {
    "sun": "Солнце", "moon": "Луна", "mars": "Марс",
    "mercury": "Меркурий", "jupiter": "Юпитер", "venus": "Венера",
    "saturn": "Сатурн", "rahu": "Раху", "ketu": "Кету",
}

for planet in PLANETS:
    for sign, (en_base, ru_base) in D9_SIGN.items():
        en = f"{PLANET_LABEL_EN[planet]} in D9 navamsa in {sign.title()}. {en_base}"
        ru = f"{PLANET_LABEL_RU[planet]} в навамше D9 в {sign.title()}. {ru_base}"
        DATA.append({"key": f"d9:{planet}:sign:{sign}", "source_id": SOURCE, "text_en": en, "text_ru": ru})

# ── house:N ──────────────────────────────────────────────────────────────────
HOUSE_BASIC = {
    1:  ("1st house — the self, body, personality, health and overall direction of life. The lagna lord is the most important planet in the chart.",
         "1-й дом — личность, тело, здоровье и общее направление жизни. Владелец лагны — важнейшая планета карты."),
    2:  ("2nd house — family, accumulated wealth, speech, face, food, early childhood and oral traditions.",
         "2-й дом — семья, накопленное богатство, речь, лицо, питание, раннее детство и устные традиции."),
    3:  ("3rd house — courage, siblings, communication, short travel, media, skills, hands and effort.",
         "3-й дом — смелость, братья и сёстры, общение, ближние путешествия, медиа, навыки, руки и усилие."),
    4:  ("4th house — home, mother, inner happiness, property, vehicles, education and emotional foundation.",
         "4-й дом — дом, мать, внутреннее счастье, собственность, транспорт, образование и эмоциональная основа."),
    5:  ("5th house — intelligence, creativity, children, past-life merit, speculation and romantic love.",
         "5-й дом — интеллект, творчество, дети, заслуги прошлых жизней, спекуляции и романтическая любовь."),
    6:  ("6th house — enemies, health challenges, debt, service, daily work, litigation and obstacles to overcome.",
         "6-й дом — враги, проблемы со здоровьем, долги, служение, повседневная работа, судебные тяжбы и препятствия."),
    7:  ("7th house — marriage, committed partnerships, public dealings, business and open enemies.",
         "7-й дом — брак, устойчивые партнёрства, публичные дела, бизнес и открытые враги."),
    8:  ("8th house — transformation, longevity, hidden matters, inheritance, occult, sudden events and death.",
         "8-й дом — трансформация, долголетие, скрытые дела, наследство, оккульт, внезапные события и смерть."),
    9:  ("9th house — dharma, higher knowledge, father, teacher, long journeys, luck and spiritual path.",
         "9-й дом — дхарма, высшее знание, отец, учитель, дальние путешествия, удача и духовный путь."),
    10: ("10th house — career, public status, authority, worldly achievement and one's action in society.",
         "10-й дом — карьера, общественный статус, авторитет, мирские достижения и действие в обществе."),
    11: ("11th house — gains, fulfillment of desires, elder siblings, social networks and income.",
         "11-й дом — прибыли, исполнение желаний, старшие братья и сёстры, социальные сети и доход."),
    12: ("12th house — liberation, foreign lands, isolation, hidden enemies, expenses and spiritual dissolution.",
         "12-й дом — освобождение, чужие земли, уединение, скрытые враги, расходы и духовное растворение."),
}

for num, (en, ru) in HOUSE_BASIC.items():
    DATA.append({"key": f"house:{num}", "source_id": SOURCE, "text_en": en, "text_ru": ru})

# ── house:N:sign ─────────────────────────────────────────────────────────────
SIGN_HOUSE_EN = {
    "aries": "Aries on this house cusp brings Mars energy: initiative, competition and directness to its domain.",
    "taurus": "Taurus on this house cusp brings Venus stability: material steadiness, beauty and patience to its domain.",
    "gemini": "Gemini on this house cusp brings Mercury intellect: versatility, communication and adaptability to its domain.",
    "cancer": "Cancer on this house cusp brings Moon sensitivity: nurturing, emotional depth and memory to its domain.",
    "leo": "Leo on this house cusp brings Sun authority: pride, creativity and radiance to its domain.",
    "virgo": "Virgo on this house cusp brings Mercury precision: analysis, service and discernment to its domain.",
    "libra": "Libra on this house cusp brings Venus balance: harmony, fairness and diplomacy to its domain.",
    "scorpio": "Scorpio on this house cusp brings Mars depth: intensity, transformation and hidden power to its domain.",
    "sagittarius": "Sagittarius on this house cusp brings Jupiter expansion: wisdom, philosophy and optimism to its domain.",
    "capricorn": "Capricorn on this house cusp brings Saturn structure: discipline, ambition and karmic duty to its domain.",
    "aquarius": "Aquarius on this house cusp brings Saturn innovation: social idealism and unconventional approach to its domain.",
    "pisces": "Pisces on this house cusp brings Jupiter spirituality: compassion, imagination and dissolution to its domain.",
}
SIGN_HOUSE_RU = {
    "aries": "Овен на кuspе этого дома привносит энергию Марса: инициативу, конкуренцию и прямоту в его область.",
    "taurus": "Телец на кuspе этого дома привносит стабильность Венеры: материальную устойчивость, красоту и терпение в его область.",
    "gemini": "Близнецы на кuspе этого дома привносят интеллект Меркурия: разносторонность, общение и адаптивность в его область.",
    "cancer": "Рак на кuspе этого дома привносит чувствительность Луны: заботу, эмоциональную глубину и память в его область.",
    "leo": "Лев на кuspе этого дома привносит авторитет Солнца: гордость, творчество и сияние в его область.",
    "virgo": "Дева на кuspе этого дома привносит точность Меркурия: анализ, служение и различение в его область.",
    "libra": "Весы на кuspе этого дома привносят баланс Венеры: гармонию, справедливость и дипломатию в его область.",
    "scorpio": "Скорпион на кuspе этого дома привносит глубину Марса: интенсивность, трансформацию и скрытую силу в его область.",
    "sagittarius": "Стрелец на кuspе этого дома привносит расширение Юпитера: мудрость, философию и оптимизм в его область.",
    "capricorn": "Козерог на кuspе этого дома привносит структуру Сатурна: дисциплину, честолюбие и кармический долг в его область.",
    "aquarius": "Водолей на кuspе этого дома привносит инновации Сатурна: социальный идеализм и нестандартный подход в его область.",
    "pisces": "Рыбы на кuspе этого дома привносят духовность Юпитера: сострадание, воображение и растворение в его область.",
}

SIGNS = ["aries","taurus","gemini","cancer","leo","virgo","libra","scorpio","sagittarius","capricorn","aquarius","pisces"]
for num in range(1, 13):
    for sign in SIGNS:
        en = f"House {num} with {sign.title()}. {SIGN_HOUSE_EN[sign]}"
        ru = f"Дом {num} со знаком {sign.title()}. {SIGN_HOUSE_RU[sign]}"
        DATA.append({"key": f"house:{num}:sign:{sign}", "source_id": SOURCE, "text_en": en, "text_ru": ru})

# ── house:N:lord ─────────────────────────────────────────────────────────────
LORD_EN = {
    "sun":     "The Sun as house lord illuminates its house with solar themes of authority, vitality and recognition.",
    "moon":    "The Moon as house lord brings emotional quality, fluctuation and nurturing instinct to its house.",
    "mars":    "Mars as house lord energizes its house with courage, competition and direct action.",
    "mercury": "Mercury as house lord brings intelligence, communication and analytical skill to its house.",
    "jupiter": "Jupiter as house lord expands its house with wisdom, abundance and dharmic blessings.",
    "venus":   "Venus as house lord graces its house with beauty, harmony and material comfort.",
    "saturn":  "Saturn as house lord disciplines its house with structure, delay and karmic responsibility.",
    "rahu":    "Rahu as house lord (dispositor ruling the sign) amplifies its house with unusual, obsessive or foreign energy.",
    "ketu":    "Ketu as house lord (dispositor ruling the sign) brings detachment, past-life release and sharp perception to its house.",
}
LORD_RU = {
    "sun":     "Солнце как владелец дома освещает его солярными темами авторитета, витальности и признания.",
    "moon":    "Луна как владелец дома привносит эмоциональное качество, колебания и заботливый инстинкт в свой дом.",
    "mars":    "Марс как владелец дома заряжает его смелостью, конкуренцией и прямым действием.",
    "mercury": "Меркурий как владелец дома привносит интеллект, коммуникацию и аналитический навык в свой дом.",
    "jupiter": "Юпитер как владелец дома расширяет его мудростью, изобилием и дхармическими благословениями.",
    "venus":   "Венера как владелец дома украшает его красотой, гармонией и материальным комфортом.",
    "saturn":  "Сатурн как владелец дома дисциплинирует его структурой, задержкой и кармической ответственностью.",
    "rahu":    "Раху как владелец дома (управитель знака на кuspе) усиливает его необычной, навязчивой или иностранной энергией.",
    "ketu":    "Кету как владелец дома (управитель знака на кuspе) привносит отстранённость, освобождение прошлых жизней и острое восприятие.",
}

LORDS = ["sun","moon","mars","mercury","jupiter","venus","saturn","rahu","ketu"]
for num in range(1, 13):
    for lord in LORDS:
        en = f"House {num} lorded by {lord.title()}. {LORD_EN[lord]}"
        ru = f"Дом {num} под управлением {lord.title()}. {LORD_RU[lord]}"
        DATA.append({"key": f"house:{num}:lord:{lord}", "source_id": SOURCE, "text_en": en, "text_ru": ru})

out = pathlib.Path(__file__).parent / "part5_lagna_d9_houses.jsonl"
with open(out, "w", encoding="utf-8") as f:
    for entry in DATA:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
print(f"Written {len(DATA)} entries to {out}")
