const state = {
  lang: "en",
  profiles: [],
  currentProfileId: null,
  currentRunId: null,
  chart: null,
  context: null,
  markdown: "",
  chartView: "2d",
};

const t = {
  ru: {
    subtitle: "точный расчет, живой отчет",
    profiles: "Профили",
    birthData: "Данные рождения",
    name: "Имя",
    date: "Дата",
    time: "Время",
    place: "Место",
    city: "Город",
    country: "Страна",
    precisePlace: "Точные координаты",
    settings: "Настройки расчета",
    aspects: "Аспекты",
    interpretations: "Интерпретации",
    nodeAspects: "Аспекты узлов",
    generate: "Построить карту",
    engine: "Swiss Ephemeris · curated sources",
    emptyTitle: "Введите данные и создайте первый расчет",
    emptyText: "Сервис сохранит профиль, запустит локальный расчетный движок и покажет карту, таблицы, источники и отчет в одном интерфейсе.",
    chartTab: "Карта",
    overview: "Обзор",
    tables: "Таблицы",
    sources: "Источники",
    report: "Отчет",
    planetTable: "Планеты",
    houseTable: "Дома",
    aspectTable: "Аспекты",
    foundSources: "Найденные источники",
    missingSources: "Недостающие ключи",
    aiTitle: "Вопрос по карте",
    ask: "Спросить",
    askPlaceholder: "Спроси о карте, периоде, домах или источниках",
    ready: "Готово",
    running: "Расчет...",
    generated: "Отчет готов",
    failed: "Ошибка",
    noProfiles: "Пока нет профилей",
    openProfile: "Открыть профиль",
    lagna: "Лагна",
    moon: "Луна",
    currentPeriod: "Текущий период",
    sourcesFound: "Источники",
    birth: "Рождение",
    location: "Локация",
    settingsLabel: "Настройки",
    warnings: "Предупреждения",
    noWarnings: "Нет предупреждений",
    markdown: "Markdown",
    chartJson: "Chart JSON",
    contextJson: "Context JSON",
    inputJson: "Input JSON",
    exportNav: "Export",
    exportTitle: "Export для AI",
    exportDesc: "Единый Markdown-файл с полными данными карты, интерпретациями и дашас — готов к загрузке в любой AI-ассистент.",
    exportDownload: "Скачать гороскоп .md",
    exportContents1: "Данные рождения и настройки расчёта",
    exportContents2: "Лагна, планеты, дома, аспекты, D9",
    exportContents3: "Интерпретации по каждому элементу карты",
    exportContents4: "Хронология Вимшоттари Даша",
    missingApiKey: "OPENROUTER_API_KEY не задан в .env.",
    deleteProfile: "Удалить профиль",
    deleteConfirm: "Удалить профиль и его отчеты?",
    namePlaceholder: "Имя профиля",
    placePlaceholder: "Город, страна",
    aiSubtitle: "ИИ отвечает только по рассчитанной карте и локальным источникам",
    chatEmptyTitle: "Спроси по карте",
    promptCareer: "Карьера",
    promptDasha: "Текущий период",
    promptRelationships: "Отношения",
    promptStrengths: "Сильные стороны",
    promptRisks: "Риски",
    promptMoney: "Деньги",
    promptCareerText: "Что в моей карте связано с карьерой и профессиональной реализацией?",
    promptDashaText: "Объясни текущий Vimshottari период и какие темы сейчас активны.",
    promptRelationshipsText: "Что рассчитанная карта показывает по теме отношений?",
    promptStrengthsText: "Какие самые сильные стороны видны в рассчитанной карте?",
    promptRisksText: "Какие риски или напряженные темы стоит учитывать по карте?",
    promptMoneyText: "Что рассчитанная карта показывает по теме денег и дохода?",
    followUpTitle: "Можно уточнить:",
    followUpTiming: "Когда это проявляется сильнее?",
    followUpHouses: "Какие дома здесь главные?",
    followUpSources: "Какие source ids это подтверждают?",
    clearChat: "Очистить",
    clearChatConfirm: "Очистить историю чата для этого профиля?",
    aiSettings: "Настройки AI",
    save: "Сохранить",
    cancel: "Отмена",
    settingsLoading: "Загрузка настроек...",
    settingsSaving: "Сохранение...",
    settingsSaved: "Настройки сохранены в .env",
    lifePathTab: "Жизненный путь",
    aiTab: "ИИ",
    lifePathTitle: "Жизненный путь",
    lifePathNow: "сейчас",
    lifePathBirth: "Рождение",
    lifePathAge: "лет",
    dashaModalThemes: "Ключевые темы",
    dashaModalFavorable: "Благоприятное",
    dashaModalChallenging: "Испытания",
    dashaModalSpiritual: "Духовная работа",
    dashaModalAntardasha: "Антардаши",
    dashaModalAntarNote: "О подпериодах",
    dashaModalDuration: "Длительность",
    dashaModalStart: "Начало",
    dashaModalEnd: "Конец",
    geoTab: "Гео",
    geoLines: "Линии планет",
    geoParans: "Параны",
    geoSearchPlaceholder: "Поиск города...",
    geoAskAI: "AI",
    geoAskAIHint: "Нажмите на карте чтобы выбрать локацию",
    geoAskAICancel: "Отмена",
    geoLoading: "Расчет астрокартографии...",
    geoError: "Ошибка расчёта карты",
    geoNoRun: "Сначала создайте отчёт",
    geoScoreGood: "благоприятно",
    geoScoreBad: "испытание",
    geoFilterAll: "Все",
    geoToggleHint: "Нажми на планету чтобы скрыть/показать",
    geoParansHint: "Пересечения линий — зоны усиленного влияния",
    geoCities: "Города",
    geoCitiesHint: "Рейтинг по близости к линиям планет",
    newProfile: "Новый профиль",
    forecastTab: "Прогноз",
    forecastTitle: "Прогноз на дату",
    forecastToday: "Сегодня",
    forecastPrev: "← день",
    forecastNext: "день →",
    forecastScore: "Оценка дня",
    forecastScoreGood: "Благоприятный",
    forecastScoreMid: "Нейтральный",
    forecastScoreBad: "Сложный",
    forecastDasha: "Активная даша",
    forecastDashaRemaining: "дней до смены антардаши",
    forecastTransits: "Транзиты планет",
    forecastAvarga: "Аштакаварга",
    forecastAvargaTitle: "Баллы транзитных планет",
    forecastAvargaBAV: "BAV",
    forecastAvargaSAV: "SAV",
    forecastAvargaHint: "BAV — баллы планеты (0–8), SAV — сумма всех планет (0–56). Норма: BAV ≥ 4, SAV ≥ 28.",
    forecastTips: "Советы и предупреждения",
    forecastAspects: "Аспекты транзитов",
    forecastAskAI: "Спросить ИИ про этот день",
    forecastLoading: "Расчёт прогноза...",
    forecastError: "Ошибка расчёта прогноза",
    forecastNoRun: "Сначала создайте отчёт",
    forecastSources: "Трактовки",
    forecastRetrograde: "Ретро",
    forecastExalted: "Экзальт.",
    forecastDebilitated: "Падение",
    forecastOwnSign: "Своё",
    forecastHouse: "Дом",
    forecastSign: "Знак",
    forecastNakshatra: "Накшатра",
    forecastDignity: "Достоинство",
    forecastPlanet: "Планета",
    forecastAspectTo: "Аспект",
    forecastOrb: "Орб",
  },
  en: {
    subtitle: "precise calculation, live report",
    profiles: "Profiles",
    birthData: "Birth data",
    name: "Name",
    date: "Date",
    time: "Time",
    place: "Place",
    city: "City",
    country: "Country",
    precisePlace: "Precise coordinates",
    settings: "Calculation settings",
    aspects: "Aspects",
    interpretations: "Interpretations",
    nodeAspects: "Node aspects",
    generate: "Generate chart",
    engine: "Swiss Ephemeris · curated sources",
    emptyTitle: "Enter birth data and create the first calculation",
    emptyText: "The service saves a profile, runs the local calculation engine, and shows the chart, tables, sources, and report in one interface.",
    chartTab: "Chart",
    overview: "Overview",
    tables: "Tables",
    sources: "Sources",
    report: "Report",
    planetTable: "Planets",
    houseTable: "Houses",
    aspectTable: "Aspects",
    foundSources: "Found sources",
    missingSources: "Missing keys",
    aiTitle: "Ask about the chart",
    ask: "Ask",
    askPlaceholder: "Ask about the chart, period, houses, or sources",
    ready: "Ready",
    running: "Calculating...",
    generated: "Report ready",
    failed: "Error",
    noProfiles: "No profiles yet",
    openProfile: "Open profile",
    lagna: "Lagna",
    moon: "Moon",
    currentPeriod: "Current period",
    sourcesFound: "Sources",
    birth: "Birth",
    location: "Location",
    settingsLabel: "Settings",
    warnings: "Warnings",
    noWarnings: "No warnings",
    markdown: "Markdown",
    chartJson: "Chart JSON",
    contextJson: "Context JSON",
    inputJson: "Input JSON",
    exportNav: "Export",
    exportTitle: "Export for AI",
    exportDesc: "A single Markdown file with full chart data, interpretations, and dashas — ready to upload to any AI assistant.",
    exportDownload: "Download horoscope .md",
    exportContents1: "Birth data and calculation settings",
    exportContents2: "Lagna, planets, houses, aspects, D9",
    exportContents3: "Interpretations for each chart element",
    exportContents4: "Vimshottari Dasha chronology",
    missingApiKey: "OPENROUTER_API_KEY is missing in .env.",
    deleteProfile: "Delete profile",
    deleteConfirm: "Delete this profile and its reports?",
    namePlaceholder: "Profile name",
    placePlaceholder: "City, country",
    aiSubtitle: "AI answers only from the calculated chart and local sources",
    chatEmptyTitle: "Ask about the chart",
    promptCareer: "Career",
    promptDasha: "Current period",
    promptRelationships: "Relationships",
    promptStrengths: "Strengths",
    promptRisks: "Risks",
    promptMoney: "Money",
    promptCareerText: "What in my chart is connected with career and professional direction?",
    promptDashaText: "Explain the current Vimshottari period and which themes are active now.",
    promptRelationshipsText: "What does the calculated chart show about relationships?",
    promptStrengthsText: "What are the strongest qualities visible in the calculated chart?",
    promptRisksText: "Which risks or tense themes should be considered from the chart?",
    promptMoneyText: "What does the calculated chart show about money and income?",
    followUpTitle: "Follow up:",
    followUpTiming: "When is this more active?",
    followUpHouses: "Which houses matter most?",
    followUpSources: "Which source ids support this?",
    clearChat: "Clear",
    clearChatConfirm: "Clear chat history for this profile?",
    aiSettings: "AI settings",
    save: "Save",
    cancel: "Cancel",
    settingsLoading: "Loading settings...",
    settingsSaving: "Saving...",
    settingsSaved: "Settings saved to .env",
    lifePathTab: "Life Path",
    aiTab: "AI",
    lifePathTitle: "Life Path",
    lifePathNow: "now",
    lifePathBirth: "Birth",
    lifePathAge: "yr",
    dashaModalThemes: "Key Themes",
    dashaModalFavorable: "Favorable",
    dashaModalChallenging: "Challenges",
    dashaModalSpiritual: "Spiritual Work",
    dashaModalAntardasha: "Antardasha Periods",
    dashaModalAntarNote: "About sub-periods",
    dashaModalDuration: "Duration",
    dashaModalStart: "Start",
    dashaModalEnd: "End",
    geoTab: "Geo",
    geoLines: "Planet lines",
    geoParans: "Parans",
    geoSearchPlaceholder: "Search city...",
    geoAskAI: "AI",
    geoAskAIHint: "Click on the map to select a location",
    geoAskAICancel: "Cancel",
    geoLoading: "Calculating astrocartography...",
    geoError: "Map calculation error",
    geoNoRun: "Generate a report first",
    geoScoreGood: "favorable",
    geoScoreBad: "challenge",
    geoFilterAll: "All",
    geoToggleHint: "Click a planet to show/hide its lines",
    geoParansHint: "Line intersections — zones of combined influence",
    geoCities: "Cities",
    geoCitiesHint: "Ranked by proximity to planet lines",
    newProfile: "New profile",
    forecastTab: "Forecast",
    forecastTitle: "Daily Forecast",
    forecastToday: "Today",
    forecastPrev: "← prev day",
    forecastNext: "next day →",
    forecastScore: "Day score",
    forecastScoreGood: "Favorable",
    forecastScoreMid: "Neutral",
    forecastScoreBad: "Challenging",
    forecastDasha: "Active dasha",
    forecastDashaRemaining: "days until antardasha ends",
    forecastTransits: "Planet transits",
    forecastAvarga: "Ashtakavarga",
    forecastAvargaTitle: "Transit planet scores",
    forecastAvargaBAV: "BAV",
    forecastAvargaSAV: "SAV",
    forecastAvargaHint: "BAV — planet score (0–8), SAV — all-planet sum (0–56). Norm: BAV ≥ 4, SAV ≥ 28.",
    forecastTips: "Tips & alerts",
    forecastAspects: "Transit aspects",
    forecastAskAI: "Ask AI about this day",
    forecastLoading: "Calculating forecast...",
    forecastError: "Forecast calculation error",
    forecastNoRun: "Generate a report first",
    forecastSources: "Interpretations",
    forecastRetrograde: "Retro",
    forecastExalted: "Exalted",
    forecastDebilitated: "Debil.",
    forecastOwnSign: "Own",
    forecastHouse: "House",
    forecastSign: "Sign",
    forecastNakshatra: "Nakshatra",
    forecastDignity: "Dignity",
    forecastPlanet: "Planet",
    forecastAspectTo: "Aspect",
    forecastOrb: "Orb",
  },
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
const ACTIVE_PROFILE_STORAGE_KEY = "astro_active_profile_id";
const ACTIVE_LANGUAGE_STORAGE_KEY = "astro_active_language";

const PLANET_ORDER = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu"];

const SIGN_META = {
  Aries: { short: "Ari", element: "Fire", mode: "Cardinal" },
  Taurus: { short: "Tau", element: "Earth", mode: "Fixed" },
  Gemini: { short: "Gem", element: "Air", mode: "Mutable" },
  Cancer: { short: "Can", element: "Water", mode: "Cardinal" },
  Leo: { short: "Leo", element: "Fire", mode: "Fixed" },
  Virgo: { short: "Vir", element: "Earth", mode: "Mutable" },
  Libra: { short: "Lib", element: "Air", mode: "Cardinal" },
  Scorpio: { short: "Sco", element: "Water", mode: "Fixed" },
  Sagittarius: { short: "Sag", element: "Fire", mode: "Mutable" },
  Capricorn: { short: "Cap", element: "Earth", mode: "Cardinal" },
  Aquarius: { short: "Aqu", element: "Air", mode: "Fixed" },
  Pisces: { short: "Pis", element: "Water", mode: "Mutable" },
};

const PLANET_META = {
  sun: { glyph: "☉", color: "#f2c45b", label: "Sun" },
  moon: { glyph: "☽", color: "#d8e6ff", label: "Moon" },
  mars: { glyph: "♂", color: "#d66b52", label: "Mars" },
  mercury: { glyph: "☿", color: "#7dd2bf", label: "Mercury" },
  jupiter: { glyph: "♃", color: "#d7b66c", label: "Jupiter" },
  venus: { glyph: "♀", color: "#e5a0c3", label: "Venus" },
  saturn: { glyph: "♄", color: "#a9a18f", label: "Saturn" },
  rahu: { glyph: "☊", color: "#9c7cff", label: "Rahu" },
  ketu: { glyph: "☋", color: "#83a2ff", label: "Ketu" },
};

const MISSING_SOURCE_MSG = "No curated interpretation source found for this key.";

const DASHA_INTERP = {
  sun: {
    years: 6,
    ru: {
      title: "Махадаша Солнца",
      essence: "Период самоопределения, власти и кармической ответственности. Солнце — атмакарака, планета души — выводит на поверхность вопрос: кто вы есть на самом деле, вне социальных ролей и чужих ожиданий.",
      themes: ["Самоидентичность и личная воля", "Карьера, власть, государственные структуры", "Отец и мужские архетипы", "Здоровье: сердце, позвоночник, глаза", "Духовная работа с эго"],
      favorable: "Признание, продвижение по службе, усиление авторитета. Благоприятно для руководящих ролей, правительственных должностей, публичной деятельности. Отцовские или мужские фигуры оказывают поддержку.",
      challenging: "Чрезмерная гордость, конфликты с властью, изоляция от близких. Риск высокомерия и жёсткости. Здоровье: нагрузка на сердце и органы зрения.",
      spiritual: "Исследуйте природу своего эго. Солнечная дашa — время честного диалога с тем, что вы называете 'я'. Практики: сурья-намаскар, медитация на свет, служение.",
      antardasha_note: "Антардаша внутри Солнечной дашa длится от нескольких месяцев до года. Каждая подпланета окрашивает период своей природой: Луна смягчает, Марс обостряет, Юпитер расширяет.",
    },
    en: {
      title: "Sun Mahadasha",
      essence: "A period of self-definition, authority, and karmic responsibility. The Sun — the planet of the soul — brings the core question to the surface: who are you, beyond social roles and others' expectations?",
      themes: ["Self-identity and personal will", "Career, power, government structures", "Father and masculine archetypes", "Health: heart, spine, eyes", "Spiritual work with the ego"],
      favorable: "Recognition, career advancement, strengthened authority. Favorable for leadership roles, government positions, and public life. Paternal or masculine figures offer support.",
      challenging: "Excessive pride, conflicts with authority, isolation from loved ones. Risk of arrogance and rigidity. Health: strain on the heart and vision.",
      spiritual: "Explore the nature of your ego. The Sun dasha is the time for an honest dialogue with what you call 'I'. Practices: surya namaskar, light meditation, service.",
      antardasha_note: "Each antardasha within the Sun dasha lasts from a few months to a year, colored by the sub-planet's nature: Moon softens, Mars sharpens, Jupiter expands.",
    },
  },
  moon: {
    years: 10,
    ru: {
      title: "Махадаша Луны",
      essence: "Десятилетие глубокого погружения в мир чувств, памяти и бессознательного. Луна управляет умом (манас), и в этот период внутренний мир становится столь же реальным, как внешний.",
      themes: ["Эмоциональная жизнь и психика", "Мать, женские фигуры, материнский архетип", "Дом, семья, корни", "Интуиция и сновидения", "Здоровье: жидкости тела, лёгкие, ментальное состояние"],
      favorable: "Расцвет интуиции, эмоциональный рост, укрепление семейных связей. Благоприятно для дел, связанных с публикой, торговлей, заботой о других. Духовные практики дают глубокие результаты.",
      challenging: "Эмоциональная нестабильность, тревожность, чрезмерная привязанность. Лунная даша усиливает как радости, так и страхи. Риск зависимости от чужого одобрения.",
      spiritual: "Работа с корневыми травмами и родовыми паттернами. Луна — хранитель прошлого; эта дашa предлагает исцелить то, что было подавлено. Практики: работа со сновидениями, медитация на воду, чадная пуджа.",
      antardasha_note: "Луна — быстрая планета, её подпериоды ощущаются особенно живо. Антардаша Марса может принести нервозность, антардаша Юпитера — мудрость и расширение.",
    },
    en: {
      title: "Moon Mahadasha",
      essence: "A decade of deep immersion in the world of feelings, memory, and the unconscious. The Moon rules the mind (manas), and during this period the inner world becomes as real as the outer one.",
      themes: ["Emotional life and psyche", "Mother, feminine figures, maternal archetype", "Home, family, roots", "Intuition and dreams", "Health: bodily fluids, lungs, mental state"],
      favorable: "Blossoming intuition, emotional growth, strengthening of family bonds. Favorable for public dealings, trade, care-giving. Spiritual practices yield deep results.",
      challenging: "Emotional instability, anxiety, excessive attachment. The Moon dasha amplifies both joys and fears. Risk of dependence on others' approval.",
      spiritual: "Work with core wounds and ancestral patterns. The Moon is the keeper of the past; this dasha offers healing of what was suppressed. Practices: dream journaling, water meditation, chandra puja.",
      antardasha_note: "The Moon is a fast planet; its sub-periods are felt vividly. The Mars antardasha can bring nervousness, Jupiter antardasha — wisdom and expansion.",
    },
  },
  mars: {
    years: 7,
    ru: {
      title: "Махадаша Марса",
      essence: "Семь лет действия, борьбы и испытания воли. Марс — Кшатрия среди планет, воин и строитель. Этот период требует мужества и ставит перед выбором: применять силу созидательно или деструктивно.",
      themes: ["Энергия, воля, действие", "Конкуренция, конфликты, суды", "Братья, мужское окружение", "Недвижимость, земля, технологии", "Здоровье: кровь, мышцы, травмы"],
      favorable: "Высокая продуктивность, реализация проектов, физическая сила. Хорошо для спорта, армии, хирургии, строительства. Способность защищать себя и близких.",
      challenging: "Вспышки гнева, несчастные случаи, операции. Риск поспешных решений, конфликтов с братьями или коллегами-мужчинами. Возможны судебные тяжбы.",
      spiritual: "Марсова дашa — тест на зрелость воина. Учитесь направлять агрессию в дисциплину, а не в разрушение. Практики: физические садханы, хануман-пуджа, пост по вторникам.",
      antardasha_note: "Марсовы антардаши короткие и интенсивные. Подпериод Раху создаёт неожиданные конфликты; Сатурн замедляет и заставляет работать системно.",
    },
    en: {
      title: "Mars Mahadasha",
      essence: "Seven years of action, struggle, and testing of will. Mars is the Kshatriya among planets — warrior and builder. This period demands courage and forces a choice: use strength constructively or destructively.",
      themes: ["Energy, will, action", "Competition, conflicts, litigation", "Brothers, male companions", "Real estate, land, technology", "Health: blood, muscles, injuries"],
      favorable: "High productivity, project execution, physical strength. Good for sports, military, surgery, construction. Ability to protect oneself and loved ones.",
      challenging: "Outbursts of anger, accidents, surgeries. Risk of hasty decisions, conflicts with brothers or male colleagues. Possible legal disputes.",
      spiritual: "The Mars dasha is a test of a warrior's maturity. Learn to channel aggression into discipline rather than destruction. Practices: physical sadhanas, Hanuman puja, Tuesday fasting.",
      antardasha_note: "Mars antardasha periods are short and intense. The Rahu sub-period creates unexpected conflicts; Saturn slows things down and demands systematic effort.",
    },
  },
  mercury: {
    years: 17,
    ru: {
      title: "Махадаша Меркурия",
      essence: "Семнадцать лет интеллектуального расцвета, коммуникации и адаптации. Меркурий — Будха — планета разума, слова и торговли. Этот период активирует ум и открывает новые информационные каналы.",
      themes: ["Интеллект, обучение, письмо", "Торговля, бизнес, переговоры", "Коммуникации, СМИ, языки", "Сестры и младшие братья", "Здоровье: нервная система, кожа, речь"],
      favorable: "Быстрое обучение, успех в бизнесе и переговорах, литературные достижения. Хорошо для программирования, журналистики, бухгалтерии. Меркурий в силе даёт остроту ума и дипломатичность.",
      challenging: "Рассеянность, двуличность, мелкое мошенничество. Чрезмерная рационализация в ущерб чувствам. Нервное напряжение. Риск сделок с нечестными партнёрами.",
      spiritual: "Меркуриальная дашa — время осознать силу слова. Каждая сказанная вами фраза — это семя. Практики: мантра-джапа, изучение санскрита или священных текстов, молчаливые ретриты.",
      antardasha_note: "17 лет Меркурия содержат длинные антардаши. Антардаша Венеры (около 2.8 лет) — период искусства и удовольствий; Сатурна — испытание дисциплиной.",
    },
    en: {
      title: "Mercury Mahadasha",
      essence: "Seventeen years of intellectual flourishing, communication, and adaptation. Mercury — Budha — is the planet of mind, word, and trade. This period activates the intellect and opens new information channels.",
      themes: ["Intellect, learning, writing", "Trade, business, negotiations", "Communications, media, languages", "Sisters and younger siblings", "Health: nervous system, skin, speech"],
      favorable: "Rapid learning, success in business and negotiations, literary achievements. Good for programming, journalism, accounting. Mercury in strength gives sharpness of mind and diplomacy.",
      challenging: "Scattered attention, duplicity, petty deceit. Over-rationalization at the expense of feelings. Nervous strain. Risk of dealings with dishonest partners.",
      spiritual: "The Mercury dasha is a time to recognize the power of words. Every phrase you speak is a seed. Practices: mantra japa, study of Sanskrit or sacred texts, silent retreats.",
      antardasha_note: "The 17 years of Mercury contain long antardasha periods. The Venus antardasha (~2.8 years) is a period of art and pleasures; Saturn's — a test of discipline.",
    },
  },
  jupiter: {
    years: 16,
    ru: {
      title: "Махадаша Юпитера",
      essence: "Шестнадцать лет роста, мудрости и благодати. Юпитер — Гуру, Брихаспати — главный благотворец в Джйотиш. Его дашa считается одной из самых благоприятных: она расширяет горизонты и приносит плоды прошлых добродетелей.",
      themes: ["Мудрость, учителя, философия", "Дети, беременность, потомки", "Закон, религия, высшее образование", "Финансовый рост, процветание", "Здоровье: печень, жир, рост"],
      favorable: "Духовный расцвет, удача в делах, рождение детей. Хорошо для обучения, юридических дел, религиозной деятельности. Встречи с мудрыми наставниками, международные связи.",
      challenging: "Чрезмерный оптимизм, расточительность, религиозный догматизм. При поражённом Юпитере — ожирение, проблемы с печенью, высокомерие. Риск упустить важные детали из-за видения 'большой картины'.",
      spiritual: "Юпитерова дашa — кульминация духовного пути. Ищите настоящего гуру, углубляйте сатсанг. Это время передавать знания другим. Практики: брахмачарья, чтение Вед и Упанишад, пуджа Брихаспати.",
      antardasha_note: "Антардаши Юпитера длинные и трансформирующие. Подпериод Раху (около 2.5 лет) может принести иностранные связи и нетрадиционные знания.",
    },
    en: {
      title: "Jupiter Mahadasha",
      essence: "Sixteen years of growth, wisdom, and grace. Jupiter — Guru, Brihaspati — is the supreme benefic in Jyotish. His dasha is considered one of the most auspicious: it expands horizons and bears the fruits of past virtues.",
      themes: ["Wisdom, teachers, philosophy", "Children, pregnancy, progeny", "Law, religion, higher education", "Financial growth, prosperity", "Health: liver, fat, growth"],
      favorable: "Spiritual blossoming, business success, birth of children. Good for education, legal matters, religious activity. Meetings with wise mentors, international connections.",
      challenging: "Excessive optimism, wastefulness, religious dogmatism. With an afflicted Jupiter — obesity, liver problems, arrogance. Risk of missing important details by focusing on the 'big picture'.",
      spiritual: "The Jupiter dasha is the culmination of the spiritual path. Seek a true guru, deepen satsang. This is the time to transmit knowledge to others. Practices: brahmacharya, reading Vedas and Upanishads, Brihaspati puja.",
      antardasha_note: "Jupiter antardasha periods are long and transformative. The Rahu sub-period (~2.5 years) may bring foreign connections and unconventional knowledge.",
    },
  },
  venus: {
    years: 20,
    ru: {
      title: "Махадаша Венеры",
      essence: "Двадцать лет — самая длинная дашa в системе. Венера — Шукра — планета желаний, красоты, любви и материального процветания. Этот период ставит вопрос: что для вас по-настоящему ценно?",
      themes: ["Любовь, отношения, брак", "Искусство, красота, творчество", "Комфорт, удовольствия, роскошь", "Финансы, накопления, ювелирные изделия", "Здоровье: репродуктивная система, почки, лицо"],
      favorable: "Брак или углубление отношений, финансовый рост, успех в искусстве. Хорошо для торговли предметами роскоши, моды, развлечений. Венус в силе даёт магнетизм и эстетический вкус.",
      challenging: "Гедонизм, зависимость от удовольствий, финансовые потери через роскошь. Ревность, измены в отношениях. При поражённой Венере — проблемы с почками, гормональные нарушения.",
      spiritual: "Венерова дашa раскрывает природу желания. Шукра — гуру асуров, владеющий тайной бессмертия. Практики: лакшми-пуджа, янтра Шукры, почитание красоты как проявления Брахмана.",
      antardasha_note: "20 лет Венеры содержат самые длинные антардаши. Подпериод Сатурна (около 3.2 лет) — трудовые усилия и ограничения; Юпитера — духовная трансформация через отношения.",
    },
    en: {
      title: "Venus Mahadasha",
      essence: "Twenty years — the longest dasha in the system. Venus — Shukra — is the planet of desires, beauty, love, and material prosperity. This period poses the question: what is truly valuable to you?",
      themes: ["Love, relationships, marriage", "Art, beauty, creativity", "Comfort, pleasures, luxury", "Finances, accumulation, jewelry", "Health: reproductive system, kidneys, face"],
      favorable: "Marriage or deepening of relationships, financial growth, success in art. Good for trade in luxury goods, fashion, entertainment. Venus in strength gives magnetism and aesthetic taste.",
      challenging: "Hedonism, addiction to pleasures, financial losses through luxury. Jealousy, infidelity. With an afflicted Venus — kidney problems, hormonal disorders.",
      spiritual: "The Venus dasha reveals the nature of desire. Shukra is the guru of the asuras, holding the secret of immortality. Practices: Lakshmi puja, Shukra yantra, honoring beauty as a manifestation of Brahman.",
      antardasha_note: "The 20 years of Venus contain the longest antardasha periods. The Saturn sub-period (~3.2 years) brings laborious effort and limitations; Jupiter's — spiritual transformation through relationships.",
    },
  },
  saturn: {
    years: 19,
    ru: {
      title: "Махадаша Сатурна",
      essence: "Девятнадцать лет испытаний, дисциплины и кармической очистки. Сатурн — Шани — строгий учитель: он убирает лишнее, тестирует терпение и вознаграждает честный труд. Это не проклятие, а предельная школа реальности.",
      themes: ["Труд, дисциплина, ответственность", "Ограничения, потери, задержки", "Долг, слуги, низшие касты", "Смерть, хроническая болезнь, одиночество", "Здоровье: кости, суставы, зубы, хроника"],
      favorable: "Если Сатурн йогакарака или хорошо расположен — долгосрочный успех через упорный труд. Уважение за честность и надёжность. Финансовая стабильность через терпение.",
      challenging: "Депрессия, изоляция, потери имущества. Конфликты с властями и работодателями. Болезни суставов, хронические состояния. Разлука с близкими.",
      spiritual: "Шани-дашa — глубочайшая карма-шода (очищение кармы). Примите ограничения как учителя. Практики: шани-пуджа по субботам, сесамовое масло, служение малоимущим, медитации на непостоянство.",
      antardasha_note: "Антардаши внутри Сатурна проверяют разные сферы жизни. Подпериод Меркурия — облегчение через коммуникацию; Венеры — краткий отдых и удовольствие.",
    },
    en: {
      title: "Saturn Mahadasha",
      essence: "Nineteen years of trials, discipline, and karmic purification. Saturn — Shani — is the strict teacher: he removes the superfluous, tests patience, and rewards honest labor. This is not a curse but the ultimate school of reality.",
      themes: ["Labor, discipline, responsibility", "Limitations, losses, delays", "Debt, servants, lower castes", "Death, chronic illness, loneliness", "Health: bones, joints, teeth, chronic conditions"],
      favorable: "If Saturn is yogakaraka or well-placed — long-term success through persistent effort. Respect for honesty and reliability. Financial stability through patience.",
      challenging: "Depression, isolation, loss of property. Conflicts with authorities and employers. Joint diseases, chronic conditions. Separation from loved ones.",
      spiritual: "The Shani dasha is the deepest karma-shodhana (karmic purification). Accept limitations as teachers. Practices: Shani puja on Saturdays, sesame oil, service to the poor, meditations on impermanence.",
      antardasha_note: "Antardasha periods within Saturn test different areas of life. The Mercury sub-period brings relief through communication; Venus — brief rest and pleasure.",
    },
  },
  rahu: {
    years: 18,
    ru: {
      title: "Махадаша Раху",
      essence: "Восемнадцать лет амбиций, нарушения границ и кармических уроков северного узла. Раху — теневая планета без физического тела — действует через одержимость и иллюзии. Он усиливает всё, к чему прикасается, вызывая нездоровое желание.",
      themes: ["Иностранное, чужое, нетрадиционное", "Амбиции, материализм, манипуляции", "Технологии, массмедиа, политика", "Карма прошлых жизней, неожиданные изменения", "Здоровье: нервная система, яды, загадочные болезни"],
      favorable: "При сильном и хорошо расположенном Раху — стремительный взлёт, неожиданный успех. Умение работать с иностранцами, нестандартное мышление. Раху даёт мирской успех через нетрадиционные пути.",
      challenging: "Иллюзии и самообман. Потеря нравственных ориентиров, скандалы. Зависимости, тяга к запрещённому. Предательства. Невротические страхи и паранойя.",
      spiritual: "Раху-дашa раскрывает, где вы ищете бесконечное в конечном. Вся эта тяга — указатель на духовный голод. Практики: раху-шанти пуджа, гомам, работа с тенью, медитации на иллюзорность.",
      antardasha_note: "Антардашa Юпитера внутри Раху (около 2.5 лет) — наиболее благоприятна: мудрость укрощает теневые желания. Кету — интенсивная развязка кармических узлов.",
    },
    en: {
      title: "Rahu Mahadasha",
      essence: "Eighteen years of ambition, boundary-crossing, and karmic lessons of the north node. Rahu — a shadow planet with no physical body — operates through obsession and illusions. It amplifies everything it touches, generating unhealthy craving.",
      themes: ["Foreign, alien, unconventional", "Ambitions, materialism, manipulation", "Technology, mass media, politics", "Past-life karma, sudden changes", "Health: nervous system, poisons, mysterious illnesses"],
      favorable: "With a strong and well-placed Rahu — rapid ascent, unexpected success. Ability to work with foreigners, unconventional thinking. Rahu grants worldly success through unorthodox paths.",
      challenging: "Illusions and self-deception. Loss of moral bearings, scandals. Addictions, craving for the forbidden. Betrayals. Neurotic fears and paranoia.",
      spiritual: "The Rahu dasha reveals where you seek the infinite in the finite. All this craving is a pointer to spiritual hunger. Practices: Rahu shanti puja, homa, shadow work, meditations on illusion.",
      antardasha_note: "The Jupiter antardasha within Rahu (~2.5 years) is the most favorable: wisdom tames shadow desires. Ketu — an intense resolution of karmic knots.",
    },
  },
  ketu: {
    years: 7,
    ru: {
      title: "Махадаша Кету",
      essence: "Семь лет отречения, отстранённости и духовного поворота. Кету — хвост дракона, южный узел — планета прошлых жизней и мокши. Там, где Раху жаждет, Кету отвергает. Этот период часто приносит потери в мирском и прибыль в духовном.",
      themes: ["Отречение, утраты, отстранённость", "Прошлые жизни, скрытые таланты", "Мистика, оккультизм, самадхи", "Болезни неизвестной этиологии", "Здоровье: ноги, желудок, нервная система"],
      favorable: "Глубокий духовный прогресс, способность к концентрации и интроспекции. Дары из прошлых жизней всплывают естественно. Хорошо для йоги, медитации, исследований.",
      challenging: "Потеря интереса к жизни, депрессия, ощущение бесцельности. Разрывы в карьере и отношениях, которые когда-то казались важными. Загадочные болезни.",
      spiritual: "Кету-дашa — дар для духовного искателя. Сам факт разочарования в мирском — указание пути к освобождению. Практики: дхьяна, випассана, кету-пуджа, изучение Упанишад.",
      antardasha_note: "Антардашa Венеры внутри Кету (около 1.2 года) — момент частичного возврата к удовольствиям; антардашa Луны — эмоциональная уязвимость и глубина.",
    },
    en: {
      title: "Ketu Mahadasha",
      essence: "Seven years of renunciation, detachment, and spiritual turning. Ketu — the dragon's tail, the south node — is the planet of past lives and moksha. Where Rahu craves, Ketu rejects. This period often brings losses in the mundane and gains in the spiritual.",
      themes: ["Renunciation, losses, detachment", "Past lives, hidden talents", "Mysticism, occultism, samadhi", "Illnesses of unknown origin", "Health: legs, stomach, nervous system"],
      favorable: "Deep spiritual progress, ability to concentrate and introspect. Gifts from past lives surface naturally. Good for yoga, meditation, research.",
      challenging: "Loss of interest in life, depression, a sense of purposelessness. Breaks in career and relationships that once seemed important. Mysterious illnesses.",
      spiritual: "The Ketu dasha is a gift for the spiritual seeker. Disillusionment with the mundane is itself a pointer toward liberation. Practices: dhyana, vipassana, Ketu puja, study of the Upanishads.",
      antardasha_note: "The Venus antardasha within Ketu (~1.2 years) brings a partial return to pleasures; the Moon antardasha — emotional vulnerability and depth.",
    },
  },
};
const SIGN_RU = {
  Aries: "Овен",
  Taurus: "Телец",
  Gemini: "Близнецы",
  Cancer: "Рак",
  Leo: "Лев",
  Virgo: "Дева",
  Libra: "Весы",
  Scorpio: "Скорпион",
  Sagittarius: "Стрелец",
  Capricorn: "Козерог",
  Aquarius: "Водолей",
  Pisces: "Рыбы",
};
const DIGNITY_LABEL = {
  neutral: { ru: "нейтрально", en: "neutral" },
  exalted: { ru: "экзальтация", en: "exalted" },
  debilitated: { ru: "падение", en: "debilitated" },
  own_sign: { ru: "собственный знак", en: "own sign" },
};

function tr(key) {
  return t[state.lang][key] || t.ru[key] || key;
}

function itemText(item) {
  if (state.lang === "en") return item.text_en || item.text || "";
  return item.text_ru || item.text || "";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function icon(name) {
  return `<svg class="icon" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data.detail ? `\n${data.detail}` : "";
    throw new Error(`${data.error || response.statusText}${detail}`);
  }
  return data;
}

function applyI18n() {
  document.documentElement.lang = state.lang;
  $$("[data-i18n]").forEach((node) => {
    node.textContent = tr(node.dataset.i18n);
  });
  $$("[data-i18n-placeholder]").forEach((node) => {
    node.placeholder = tr(node.dataset.i18nPlaceholder);
  });
  $$("[data-i18n-title]").forEach((node) => {
    node.title = tr(node.dataset.i18nTitle);
  });
  $$("[data-lang-only]").forEach((node) => {
    node.hidden = node.dataset.langOnly !== state.lang;
  });
  $$("[data-lang]").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === state.lang);
  });
}

function setStatus(text, tone = "") {
  const pill = $("#statusPill");
  if (!pill) return;
  pill.textContent = text;
  pill.style.borderColor = tone === "error" ? "rgba(208, 107, 102, 0.7)" : "";
  pill.style.color = tone === "error" ? "var(--danger)" : "";
}

let chart3dModulePromise = null;

async function loadChart3dModule() {
  if (chart3dModulePromise) return chart3dModulePromise;
  const specifiers = [`/chart3d.mjs?v=${Date.now()}`, "/chart3d.mjs", "/chart3d.js"];
  chart3dModulePromise = (async () => {
    let lastError = null;
    for (const specifier of specifiers) {
      try {
        return await import(specifier);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error("3D chart module is unavailable.");
  })();
  return chart3dModulePromise;
}

async function loadProfiles() {
  const data = await api("/api/profiles");
  state.profiles = data.profiles || [];
  renderProfiles();
  const currentExists = state.currentProfileId && state.profiles.some((item) => item.id === state.currentProfileId);
  if (currentExists) return;

  const savedProfileId = getSavedActiveProfileId();
  const savedExists = savedProfileId && state.profiles.some((item) => item.id === savedProfileId);
  const fallbackProfile = state.profiles.find((item) => item.last_run_id) || state.profiles[0];
  const targetProfileId = (savedExists ? savedProfileId : fallbackProfile?.id) || null;
  if (targetProfileId) {
    await selectProfile(targetProfileId);
  }
}

function renderProfiles() {
  const list = $("#profileList");
  if (!state.profiles.length) {
    list.innerHTML = `<div class="profile-item"><span>${escapeHtml(tr("noProfiles"))}</span></div>`;
    return;
  }
  list.innerHTML = state.profiles
    .map((profile) => {
      const active = profile.id === state.currentProfileId ? " active" : "";
      const summary = profile.last_summary?.current_period || `${profile.birth?.birth_date || ""} ${profile.birth?.birth_time || ""}`;
      return `
        <div class="profile-item${active}" data-profile-id="${escapeHtml(profile.id)}">
          <button class="profile-open" type="button" data-profile-open="${escapeHtml(profile.id)}">
            <span class="profile-symbol">${icon("user")}</span>
            <span>
              <strong>${escapeHtml(profile.name || "Unnamed")}</strong>
              <span>${escapeHtml(summary)}</span>
            </span>
          </button>
          <button class="profile-delete" type="button" data-profile-delete="${escapeHtml(profile.id)}" title="${escapeHtml(tr("deleteProfile"))}">${icon("trash")}</button>
        </div>
      `;
    })
    .join("");
  $$("[data-profile-open]").forEach((button) => {
    button.addEventListener("click", () => selectProfile(button.dataset.profileOpen));
  });
  $$("[data-profile-delete]").forEach((button) => {
    button.addEventListener("click", () => deleteProfile(button.dataset.profileDelete));
  });
}

async function deleteProfile(profileId) {
  if (!confirm(tr("deleteConfirm"))) return;
  try {
    if (getSavedActiveProfileId() === profileId) {
      clearSavedActiveProfileId();
    }
    await api(`/api/profiles/${profileId}`, { method: "DELETE" });
    if (state.currentProfileId === profileId) {
      state.currentProfileId = null;
      state.currentRunId = null;
      state.chart = null;
      state.context = null;
      state.markdown = "";
      $("#birthForm").reset();
      $("#placeQuery").value = "";
      $("#resultLayout").classList.add("hidden");
      $("#emptyState").classList.remove("hidden");
    }
    await loadProfiles();
  } catch (error) {
    alert(error.message);
  }
}

async function selectProfile(profileId) {
  const profile = state.profiles.find((item) => item.id === profileId);
  if (!profile) return;
  state.currentProfileId = profileId;
  saveActiveProfileId(profileId);
  fillForm(profile.birth, profile.place);
  renderProfiles();
  updateProfileModeBadge();
  if (profile.last_run_id) {
    const data = await api(`/api/reports/${profile.last_run_id}`);
    applyReport(data.manifest, data.chart, data.context, data.markdown);
    renderChatHistory(profile.chat_history || []);
  }
}

function newProfile() {
  state.currentProfileId = null;
  clearSavedActiveProfileId();
  const form = $("#birthForm");
  form.reset();
  $("#placeQuery").value = "";
  renderProfiles();
  updateProfileModeBadge();
}

function updateProfileModeBadge() {
  const badge = $("#profileModeBadge");
  if (!badge) return;
  const isRu = state.lang === "ru";
  if (state.currentProfileId) {
    const profile = state.profiles.find(p => p.id === state.currentProfileId);
    badge.textContent = profile?.name || (isRu ? "редактирование" : "editing");
    badge.className = "profile-mode-badge profile-mode-badge--edit";
  } else {
    badge.textContent = isRu ? "новый" : "new";
    badge.className = "profile-mode-badge profile-mode-badge--new";
  }
}

function fillForm(birth, place) {
  const form = $("#birthForm");
  form.name.value = birth?.name || "";
  form.birth_date.value = birth?.birth_date || "";
  form.birth_time.value = birth?.birth_time || "";
  form.city.value = birth?.city || "";
  form.country.value = birth?.country || "";
  form.latitude.value = place?.lat || place?.latitude || "";
  form.longitude.value = place?.lon || place?.longitude || "";
  form.timezone.value = place?.timezone || "";
  $("#placeQuery").value = place?.name || `${birth?.city || ""}, ${birth?.country || ""}`.replace(/^,\s*/, "");
}

function collectBirthPayload() {
  const form = $("#birthForm");
  const birth = {
    name: form.name.value.trim(),
    birth_date: form.birth_date.value,
    birth_time: form.birth_time.value,
    city: form.city.value.trim(),
    country: form.country.value.trim(),
    language: state.lang,
    settings: {
      ayanamsa: form.ayanamsa.value,
      zodiac: form.zodiac.value,
      house_system: form.house_system.value,
      dasha_system: form.dasha_system.value,
      include_navamsa: form.include_navamsa.checked,
      include_aspects: form.include_aspects.checked,
      include_interpretation: form.include_interpretation.checked,
      include_clickable_keys: true,
      enable_node_aspects: form.enable_node_aspects.checked,
    },
  };
  const latitude = form.latitude.value.trim();
  const longitude = form.longitude.value.trim();
  const timezone = form.timezone.value.trim();
  const place =
    latitude && longitude && timezone
      ? {
          display_name: $("#placeQuery").value.trim() || `${birth.city}, ${birth.country}`,
          latitude: Number(latitude),
          longitude: Number(longitude),
          timezone,
        }
      : null;
  return { birth, place, profile_id: state.currentProfileId };
}

async function generateReport(event) {
  event.preventDefault();
  const button = $("#generateBtn");
  button.disabled = true;
  setStatus(tr("running"));
  try {
    const payload = collectBirthPayload();
    const data = await api("/api/reports", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    state.currentProfileId = data.profile.id;
    applyReport(data.run, data.chart, data.context, data.markdown);
    await loadProfiles();
    updateProfileModeBadge();
    setStatus(tr("generated"));
  } catch (error) {
    setStatus(tr("failed"), "error");
    alert(error.message);
  } finally {
    button.disabled = false;
  }
}

function applyReport(run, chart, context, markdown) {
  closePlanetInterpretationModal();
  saveActiveProfileId(state.currentProfileId);
  // Reset geo state for new run
  _geoState.lineObjects = [];
  _geoState.filterActive.clear();
  if (_geoState.map) {
    Object.values(_geoState.layers).forEach((lg) => _geoState.map.removeLayer(lg));
  }
  _geoState.layers = {};
  state.currentRunId = run.id;
  state.chart = chart;
  state.context = context;
  state.markdown = markdown;
  $("#emptyState").classList.add("hidden");
  $("#resultLayout").classList.remove("hidden");
  renderSummary(run.summary);
  renderD1(chart);
  renderD9(chart);
  renderOverview(chart, context);
  renderTables(chart);
  renderDashas(chart);
  renderSources(context);
  renderReport(run, markdown);
  setActiveTab("chart");
  renderChatHistory([]);
}

function renderSummary(summary) {
  const items = [
    ["sun",   tr("lagna"),         summary.lagna,         "lagna"],
    ["moon",  tr("moon"),          summary.moon,          "moon"],
    ["clock", tr("currentPeriod"), summary.current_period, "dashas"],
    ["book",  tr("sourcesFound"),  summary.sources_missing > 0 ? `${summary.sources_found} / ${summary.sources_missing}` : `${summary.sources_found}`, "sources"],
  ];
  const grid = $("#summaryGrid");
  grid.innerHTML = items
    .map(([iconName, label, value, action]) =>
      `<div class="summary-card summary-card--clickable" data-action="${action}">` +
      `<i>${icon(iconName)}</i><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>` +
      `</div>`
    )
    .join("");

}

function renderD1(chart) {
  if (state.chartView === "3d") {
    renderD1_3d(chart);
  } else {
    renderD1_2d(chart);
  }
}

function renderD1_3d(chart) {
  const container = $("#d1Chart");
  _clearD1Container(container);
  const stage = document.createElement("div");
  stage.className = "three-chart-stage";
  container.appendChild(stage);
  loadChart3dModule()
    .then((module) =>
      module.renderChart3D(stage, chart, {
        onPlanetSelect: (payload) => openPlanetInterpretationModal(payload),
      })
    )
    .catch((error) => {
      chart3dModulePromise = null;
      stage.innerHTML = `<div class="chart-loading">3D chart unavailable: ${escapeHtml(error.message)}</div>`;
    });
}

function _clearD1Container(container) {
  // Remove everything except the inner modal
  Array.from(container.children).forEach((child) => {
    if (!child.id || child.id !== "chartInnerModal") child.remove();
  });
}

function renderD1_2d(chart) {
  const container = $("#d1Chart");
  _clearD1Container(container);

  const houses = chart.houses || {};
  const planets = chart.planets || {};
  const lagna = chart.lagna || {};

  const SIGNS_ORDER = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
  const lagnaSign = lagna.sign || Object.values(houses).find((h) => h)?.sign || "Aries";
  const lagnaIdx = Math.max(0, SIGNS_ORDER.indexOf(lagnaSign));

  const houseSignMap = [];
  for (let i = 0; i < 12; i++) houseSignMap.push(SIGNS_ORDER[(lagnaIdx + i) % 12]);

  const planetsByHouse = {};
  for (const [pkey, pdata] of Object.entries(planets)) {
    const h = pdata.house;
    if (!h) continue;
    if (!planetsByHouse[h]) planetsByHouse[h] = [];
    planetsByHouse[h].push(pkey);
  }

  _renderNorthIndianChart(container, chart, lagnaSign, lagnaIdx, houseSignMap, planetsByHouse, planets);
}

function _renderNorthIndianChart(container, chart, lagnaSign, lagnaIdx, houseSignMap, planetsByHouse, planets) {
  const svgNS = "http://www.w3.org/2000/svg";
  const V = 480;
  const C = V / 4; // cell = 120

  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", `0 0 ${V} ${V}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.setAttribute("class", "ni-chart-svg");

  // [12][1][2][3]  /  [11][ ][ ][4]  /  [10][ ][ ][5]  /  [9][8][7][6]
  const HOUSE_GRID = {
    12:{col:0,row:0}, 1:{col:1,row:0}, 2:{col:2,row:0}, 3:{col:3,row:0},
    11:{col:0,row:1},                                    4:{col:3,row:1},
    10:{col:0,row:2},                                    5:{col:3,row:2},
     9:{col:0,row:3}, 8:{col:1,row:3}, 7:{col:2,row:3}, 6:{col:3,row:3},
  };

  // Corner cells get a diagonal accent line (traditional NI style)
  const CORNER_DIAG = {
    12: [[0,0],[C,C]],
    3:  [[C,0],[0,C]],
    9:  [[0,0],[C,C]],
    6:  [[C,0],[0,C]],
  };

  const SIGN_GLYPHS = {
    Aries:"♈",Taurus:"♉",Gemini:"♊",Cancer:"♋",Leo:"♌",Virgo:"♍",
    Libra:"♎",Scorpio:"♏",Sagittarius:"♐",Capricorn:"♑",Aquarius:"♒",Pisces:"♓"
  };

  function mk(tag, attrs) {
    const el = document.createElementNS(svgNS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  }

  // Defs: glow filter + gradients
  const defs = mk("defs", {});
  defs.innerHTML = `
    <filter id="ni-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="ni-soft" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <radialGradient id="ni-bg-grad" cx="50%" cy="50%" r="65%">
      <stop offset="0%" stop-color="#100a2a" stop-opacity="1"/>
      <stop offset="55%" stop-color="#08061a" stop-opacity="1"/>
      <stop offset="100%" stop-color="#040311" stop-opacity="1"/>
    </radialGradient>
    <radialGradient id="ni-center-grad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#1a1340" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#03020c" stop-opacity="0.95"/>
    </radialGradient>
    <linearGradient id="ni-lagna-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f3d27a" stop-opacity="0"/>
      <stop offset="50%" stop-color="#f3d27a" stop-opacity="1"/>
      <stop offset="100%" stop-color="#f3d27a" stop-opacity="0"/>
    </linearGradient>`;
  svg.appendChild(defs);

  // Background (gradient)
  svg.appendChild(mk("rect", {x:0,y:0,width:V,height:V,fill:"url(#ni-bg-grad)"}));

  // Cell backgrounds — drawn first
  for (const [houseNum, pos] of Object.entries(HOUSE_GRID)) {
    const h = Number(houseNum);
    const x = pos.col * C;
    const y = pos.row * C;
    svg.appendChild(mk("rect", {x,y,width:C,height:C,class:"ni-cell-hit"}));
  }

  // Grid lines
  for (let i = 1; i < 4; i++) {
    svg.appendChild(mk("line", {x1:i*C,y1:0,x2:i*C,y2:V,class:"ni-grid"}));
    svg.appendChild(mk("line", {x1:0,y1:i*C,x2:V,y2:i*C,class:"ni-grid"}));
  }

  // Center area
  svg.appendChild(mk("rect", {x:C,y:C,width:2*C,height:2*C,fill:"url(#ni-center-grad)",
    stroke:"rgba(216,183,100,0.32)","stroke-width":"1"}));

  // Center decorative ring
  const ringR = C * 0.78;
  svg.appendChild(mk("circle", {cx:V/2, cy:V/2, r:ringR,
    fill:"none", stroke:"rgba(216,183,100,0.12)", "stroke-width":"1",
    "stroke-dasharray":"2 4"}));
  svg.appendChild(mk("circle", {cx:V/2, cy:V/2, r:ringR*0.68,
    fill:"none", stroke:"rgba(108,140,255,0.16)", "stroke-width":"1"}));

  // Center Om
  const cx = mk("text", {x:V/2, y:V/2+3, "text-anchor":"middle","dominant-baseline":"middle",
    style:"font-size:42px;fill:rgba(216,183,100,0.22);pointer-events:none;font-weight:700;"});
  cx.textContent = "ॐ";
  svg.appendChild(cx);

  // Cardinal direction labels (Vedic: N=top, E=left, S=bottom, W=right — but for visual, use compass)
  const dirStyle = "font-size:9px;fill:rgba(216,183,100,0.42);pointer-events:none;letter-spacing:1px;font-weight:600;";
  const dirs = [
    ["N", V/2,        C + 10],
    ["S", V/2,        3*C - 6],
    ["E", C + 10,     V/2 + 3],
    ["W", 3*C - 10,   V/2 + 3],
  ];
  for (const [t, dx, dy] of dirs) {
    const d = mk("text", {x:dx, y:dy, "text-anchor":"middle","dominant-baseline":"middle", style:dirStyle});
    d.textContent = t;
    svg.appendChild(d);
  }

  // Outer border (on top)
  svg.appendChild(mk("rect", {x:1,y:1,width:V-2,height:V-2,class:"ni-border"}));
  // Outer accent glow border
  svg.appendChild(mk("rect", {x:5,y:5,width:V-10,height:V-10,
    fill:"none",stroke:"rgba(216,183,100,0.12)","stroke-width":"1"}));

  // House cells — text + planets
  for (const [houseNum, pos] of Object.entries(HOUSE_GRID)) {
    const h = Number(houseNum);
    const x = pos.col * C;
    const y = pos.row * C;
    const sign = houseSignMap[h - 1];
    const glyph = SIGN_GLYPHS[sign] || "?";
    const planetsHere = planetsByHouse[h] || [];
    const pCount = planetsHere.length;

    // Corner diagonal accent
    const diagCoords = CORNER_DIAG[h];
    if (diagCoords) {
      svg.appendChild(mk("line", {
        x1: x + diagCoords[0][0], y1: y + diagCoords[0][1],
        x2: x + diagCoords[1][0], y2: y + diagCoords[1][1],
        class: "ni-corner-diag"
      }));
    }

    // House number
    const hn = mk("text", {x:x+5,y:y+12,class:"ni-house-num","text-anchor":"start"});
    hn.textContent = h;
    svg.appendChild(hn);

    // Lagna marker on house 1: diagonal + ASC label
    if (h === 1) {
      svg.appendChild(mk("line", {x1:x+C,y1:y,x2:x,y2:y+C,class:"ni-lagna-diag"}));
      const asc = mk("text", {x:x+C-5,y:y+12,class:"ni-asc-label","text-anchor":"end"});
      asc.textContent = "ASC";
      svg.appendChild(asc);
    }

    // Keep sign position fixed so the chart grid reads consistently
    const hasPlanets = pCount > 0;
    const signCY = y + C * 0.33;

    const signCX = x + C / 2;

    // Sign glyph
    const sg = mk("text", {x:signCX, y:signCY, class:"ni-sign-glyph",
      "text-anchor":"middle","dominant-baseline":"middle"});
    sg.textContent = glyph;
    svg.appendChild(sg);

    // Sign abbreviation
    const sn = mk("text", {x:signCX, y:signCY+20, class:"ni-sign-name",
      "text-anchor":"middle"});
    sn.textContent = sign.slice(0,3).toUpperCase();
    svg.appendChild(sn);

    // Planets
    if (hasPlanets) {
      const cols = pCount > 3 ? 2 : 1;
      const perCol = Math.ceil(pCount / cols);
      const colXs = cols === 1
        ? [x + C / 2]
        : [x + C * 0.3, x + C * 0.7];
      const pAreaTop = signCY + 30;
      const pAreaBottom = y + C - 10;
      const rowStep = perCol > 1
        ? Math.min(18, (pAreaBottom - pAreaTop) / (perCol - 1))
        : 0;

      planetsHere.forEach((pkey, idx) => {
        const meta = PLANET_META[pkey] || {glyph:"?",color:"#d8b764",label:pkey};
        const pdata = (planets && planets[pkey]) || {};
        const ci = Math.floor(idx / perCol);
        const ri = idx % perCol;
        const px = colXs[ci];
        const py = pAreaTop + ri * rowStep;

        // Clickable group
        const g = mk("g", {class:"ni-planet-g", style:"cursor:pointer;"});
        g.addEventListener("click", (e) => {
          e.stopPropagation();
          openPlanetInterpretationModal({planet_key: pkey, division: "D1", source: "d1"});
        });

        const chipW = cols === 2 ? C * 0.36 : C * 0.62;
        const chipH = 15;
        // Background chip
        g.appendChild(mk("rect", {
          x: px - chipW/2, y: py - chipH/2,
          width: chipW, height: chipH, rx: 3, ry: 3,
          fill: "rgba(7,5,20,0.9)",
          stroke: meta.color, "stroke-opacity": "0.4", "stroke-width": "0.8",
        }));

        // Planet label
        const txt = mk("text", {
          x: px, y: py + 1,
          class: "ni-planet-chip",
          "text-anchor": "middle",
          "dominant-baseline": "middle",
          fill: meta.color,
          "data-planet": pkey,
        });
        const lbl = meta.label.slice(0,3);
        const deg = (typeof pdata.sign_degree === "number")
          ? `${Math.floor(pdata.sign_degree)}°`
          : (typeof pdata.degree === "number" ? `${Math.floor(pdata.degree)}°` : "");
        const retro = pdata.retrograde ? " ℞" : "";
        txt.textContent = cols === 2
          ? `${meta.glyph}${lbl}${retro}`
          : `${meta.glyph} ${lbl}${retro}${deg ? " " + deg : ""}`;
        g.appendChild(txt);

        svg.appendChild(g);
      });
    }
  }

  container.insertBefore(svg, container.firstChild);
}

function initChartViewToggle() {
  const btn2d = $("#btn2d");
  const btn3d = $("#btn3d");
  if (!btn2d || !btn3d) return;

  btn2d.addEventListener("click", () => {
    if (state.chartView === "2d") return;
    state.chartView = "2d";
    btn2d.classList.add("active");
    btn3d.classList.remove("active");
    if (state.chart) renderD1(state.chart);
  });

  btn3d.addEventListener("click", () => {
    if (state.chartView === "3d") return;
    state.chartView = "3d";
    btn3d.classList.add("active");
    btn2d.classList.remove("active");
    if (state.chart) renderD1(state.chart);
  });
}

function scorePlanet(key, chart) {
  // Natural benefic/malefic base
  const BASE = { sun:5, moon:6, mars:4, mercury:6, jupiter:7, venus:7, saturn:4, rahu:3, ketu:3 };
  let score = BASE[key] ?? 5;

  const p = chart.planets?.[key];
  if (!p) return score;

  // Dignity in D1
  if (p.dignity === "exalted")    score += 2.5;
  if (p.dignity === "own_sign")   score += 1.5;
  if (p.dignity === "debilitated") score -= 2.5;

  // House placement: kendra(1,4,7,10)=+1, trikona(1,5,9)=+1, dusthana(6,8,12)=-1.5
  const h = p.house;
  if ([1,4,7,10].includes(h)) score += 1;
  if ([1,5,9].includes(h))    score += 1;
  if ([6,8,12].includes(h))   score -= 1.5;

  // Retrograde: context-dependent, mild penalty
  if (p.retrograde) score -= 0.5;

  // D9 dignity
  const d9sign = chart.divisional_charts?.D9?.planets?.[key]?.sign;
  if (d9sign) {
    const D9_EXALT = { sun:"Aries", moon:"Taurus", mars:"Capricorn", mercury:"Virgo",
      jupiter:"Cancer", venus:"Pisces", saturn:"Libra" };
    const D9_DEBIL = { sun:"Libra", moon:"Scorpio", mars:"Cancer", mercury:"Pisces",
      jupiter:"Capricorn", venus:"Virgo", saturn:"Aries" };
    const D9_OWN = { sun:["Leo"], moon:["Cancer"], mars:["Aries","Scorpio"],
      mercury:["Gemini","Virgo"], jupiter:["Sagittarius","Pisces"],
      venus:["Taurus","Libra"], saturn:["Capricorn","Aquarius"] };
    if (D9_EXALT[key] === d9sign)              score += 1;
    if (D9_DEBIL[key] === d9sign)              score -= 1;
    if ((D9_OWN[key] || []).includes(d9sign))  score += 0.5;
  }

  return Math.max(0.5, Math.min(10, Math.round(score * 10) / 10));
}

function renderD9(chart) {
  const planets = chart.divisional_charts?.D9?.planets || {};
  const entries = PLANET_ORDER.filter((key) => planets[key]).map((key) => [key, planets[key]]);
  const container = $("#d9Chart");
  const badge = $("#d9Badge");

  if (!entries.length) {
    container.innerHTML = `<div class="d9-empty">D9 data is missing.</div>`;
    if (badge) badge.textContent = "No data";
    return;
  }

  const signCounts = {};
  const elementCounts = {};
  for (const [, value] of entries) {
    const sign = value.sign || "Unknown";
    signCounts[sign] = (signCounts[sign] || 0) + 1;
    const element = SIGN_META[sign]?.element || "Unknown";
    elementCounts[element] = (elementCounts[element] || 0) + 1;
  }

  const dominantSigns = Object.entries(signCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const dominantElements = Object.entries(elementCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);
  const total = entries.length;

  if (badge) badge.textContent = `${total} placements`;

  const spectrum = dominantSigns
    .map(([sign, count]) => {
      const pct = Math.round((count / total) * 100);
      return `
        <div class="d9-spectrum-row">
          <span>${escapeHtml(sign)}</span>
          <div class="d9-spectrum-track"><i style="width:${pct}%"></i></div>
          <em>${count}</em>
        </div>
      `;
    })
    .join("");

  const cards = entries
    .map(([key, value]) => {
      const meta = PLANET_META[key] || { glyph: "•", color: "#d8b764", label: cap(key) };
      const sign = value.sign || "missing";
      const signMeta = SIGN_META[sign] || { short: sign, element: "Unknown", mode: "Unknown" };
      const score = scorePlanet(key, chart);
      const pct = score * 10;
      const scoreColor = score >= 7.5 ? "#8ec97a" : score >= 5 ? "#f0b84a" : "#e07060";
      const d1 = chart.planets?.[key];
      const dignityLabel = d1?.dignity && d1.dignity !== "neutral"
        ? (state.lang === "ru"
          ? ({exalted:"экз.",debilitated:"пад.",own_sign:"свой"})[d1.dignity]
          : ({exalted:"exalt.",debilitated:"debil.",own_sign:"own"})[d1.dignity] || d1.dignity)
        : "";
      return `
        <article class="d9-card" data-d9-planet="${escapeHtml(key)}" role="button" tabindex="0">
          <div class="d9-card-head">
            <span class="d9-glyph" style="--planet-color:${escapeHtml(meta.color)}">${escapeHtml(meta.glyph)}</span>
            <div>
              <strong>${escapeHtml(meta.label)}</strong>
            </div>
            <b>${escapeHtml(signMeta.short)}</b>
          </div>
          <div class="d9-card-footer">
            <span class="d9-card-meta-tag">${escapeHtml(signMeta.element)}</span>
            <span class="d9-card-meta-tag">${escapeHtml(signMeta.mode)}</span>
            <span class="d9-score-spacer"></span>
            ${dignityLabel ? `<span class="d9-score-dignity" style="color:${scoreColor}">${escapeHtml(dignityLabel)}</span>` : ""}
            <span class="d9-score-num" style="color:${scoreColor}">${score.toFixed(1)}</span>
          </div>
          <div class="d9-score-track">
            <div class="d9-score-fill" style="width:${pct}%;background:${scoreColor}"></div>
          </div>
        </article>
      `;
    })
    .join("");

  container.innerHTML = `
    <section class="d9-summary">
      <div class="d9-kpi">
        <span>Dominant signs</span>
        <strong>${escapeHtml(dominantSigns.map(([sign]) => sign).join(" · "))}</strong>
      </div>
      <div class="d9-kpi">
        <span>Element focus</span>
        <strong>${escapeHtml(dominantElements.map(([name]) => name).join(" · "))}</strong>
      </div>
      <div class="d9-spectrum">${spectrum}</div>
    </section>
    <section class="d9-grid">${cards}</section>
  `;

  container.querySelectorAll("[data-d9-planet]").forEach((node) => {
    node.addEventListener("click", () => {
      openPlanetInterpretationModal({
        division: "D9",
        source: "d9-card",
        planet_key: node.dataset.d9Planet,
      });
    });
    node.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openPlanetInterpretationModal({
        division: "D9",
        source: "d9-card",
        planet_key: node.dataset.d9Planet,
      });
    });
  });
}

function localizeMissingMessage(message) {
  if ((message || "").trim() !== MISSING_SOURCE_MSG) return message || "";
  return state.lang === "ru" ? "Для этого ключа не найден локальный источник трактовки." : MISSING_SOURCE_MSG;
}

function localizeSign(sign) {
  if (!sign) return "missing";
  if (state.lang !== "ru") return sign;
  return SIGN_RU[sign] ? `${sign} (${SIGN_RU[sign]})` : sign;
}

function localizeDignity(value) {
  if (!value) return "missing";
  const entry = DIGNITY_LABEL[value];
  if (!entry) return value;
  return state.lang === "ru" ? entry.ru : entry.en;
}

function sourceLangLabel(sourceId) {
  const language = sourceId?.startsWith("curated:") ? "EN" : "EN";
  return state.lang === "ru" ? `Язык: ${language}` : `Language: ${language}`;
}

function _getPlanetModalEls() {
  // Use inner chart modal for 2D view, global modal for 3D/D9
  const inner = $("#chartInnerModal");
  if (inner && state.chartView === "2d") {
    return {
      titleEl: $("#chartInnerModalTitle"),
      bodyEl: $("#chartInnerModalBody"),
      modalEl: inner,
    };
  }
  return {
    titleEl: $("#planetModalTitle"),
    bodyEl: $("#planetModalBody"),
    modalEl: $("#planetModal"),
  };
}

function openPlanetInterpretationModal(payload) {
  if (!payload?.planet_key || !state.chart || !state.context) return;
  const planetKey = payload.planet_key;
  const isRu = state.lang === "ru";
  const division = payload.division === "D9" ? (isRu ? "D9 \u041d\u0430\u0432\u0430\u043c\u0448\u0430" : "D9 Navamsa") : "D1 Rashi";
  const planetMeta = PLANET_META[planetKey] || { label: cap(planetKey) };
  const d1Planet = state.chart.planets?.[planetKey] || null;
  const d9Planet = state.chart.divisional_charts?.D9?.planets?.[planetKey] || null;

  const interpretationKeys = [];
  if (d1Planet?.clickable_keys?.length) interpretationKeys.push(...d1Planet.clickable_keys);
  if (payload.division === "D9" && d9Planet?.clickable_key) interpretationKeys.unshift(d9Planet.clickable_key);
  if (!interpretationKeys.length) interpretationKeys.push(`planet:${planetKey}`);
  const uniqueKeys = [...new Set(interpretationKeys)];

  const foundByKey = new Map();
  for (const key of uniqueKeys) {
    const matches = (state.context.items || []).filter((item) => item.key === key);
    if (matches.length) foundByKey.set(key, matches);
  }
  const foundItems = uniqueKeys.flatMap((key) => foundByKey.get(key) || []);
  const dedupedSources = [];
  const seen = new Set();
  for (const item of foundItems) {
    const signature = `${item.key}::${item.source_id}`;
    if (seen.has(signature)) continue;
    seen.add(signature);
    dedupedSources.push(item);
  }

  const missingEntries = uniqueKeys
    .filter((key) => !foundByKey.has(key))
    .map((key) => (state.context.missing || []).find((item) => item.key === key) || { key, message: MISSING_SOURCE_MSG });

  const { titleEl, bodyEl, modalEl } = _getPlanetModalEls();
  if (!titleEl || !bodyEl || !modalEl) return;

  // Hero header
  const sign = d1Planet?.sign ? localizeSign(d1Planet.sign) : "";
  const house = d1Planet?.house ?? "";
  const nakshatra = d1Planet?.nakshatra ?? "";
  const pada = d1Planet?.pada ? (isRu ? "пада " + d1Planet.pada : "pada " + d1Planet.pada) : "";
  const deg = d1Planet?.degree_formatted ?? "";
  const retro = d1Planet?.retrograde;
  const dignity = d1Planet?.dignity ? localizeDignity(d1Planet.dignity) : "";
  const rulerOf = (d1Planet?.ruler_of_houses || []).join(", ");
  const d9sign = d9Planet?.sign ? localizeSign(d9Planet.sign) : "";

  const badges = [];
  if (sign) badges.push({label: isRu ? "Знак" : "Sign", val: sign});
  if (house) badges.push({label: isRu ? "Дом" : "House", val: String(house)});
  if (nakshatra) badges.push({label: isRu ? "Накшатра" : "Nakshatra", val: nakshatra + (pada ? " · " + pada : "")});
  if (deg) badges.push({label: isRu ? "Градус" : "Degree", val: deg});
  if (dignity) badges.push({label: isRu ? "Достоинство" : "Dignity", val: dignity});
  if (retro) badges.push({label: isRu ? "Ретро" : "Retro", val: "℞", accent: true});
  if (d9sign) badges.push({label: "D9", val: d9sign});
  if (rulerOf) badges.push({label: isRu ? "Управитель" : "Rules", val: "H" + rulerOf});

  titleEl.innerHTML =
    '<span class="pim-glyph" style="color:' + escapeHtml(planetMeta.color || "#d8b764") + '">' + escapeHtml(planetMeta.glyph || "") + '</span>' +
    '<span class="pim-name">' + escapeHtml(planetMeta.label) + '</span>' +
    '<span class="pim-div-tag">' + escapeHtml(division) + '</span>';

  const badgesHtml = badges.length
    ? '<div class="pim-badges">' +
        badges.map(b =>
          '<div class="pim-badge' + (b.accent ? ' pim-badge--accent' : '') + '">' +
          '<div class="pim-badge-label">' + escapeHtml(b.label) + '</div>' +
          '<div class="pim-badge-val">' + escapeHtml(b.val) + '</div></div>'
        ).join("") +
      '</div>'
    : "";

  const sourceHtml = dedupedSources.length
    ? '<section class="pim-section">' +
        '<div class="pim-section-head"><span>' + (isRu ? "Трактовки" : "Interpretations") + '</span><span class="pim-count">' + dedupedSources.length + '</span></div>' +
        '<div class="pim-cards-grid">' +
        dedupedSources.map(item =>
          '<div class="pim-card">' +
          '<div class="pim-card-meta">' +
          '<span class="pim-interp-key">' + escapeHtml(item.key) + '</span>' +
          '<span class="pim-interp-src">' + escapeHtml(item.source_id) + '</span>' +
          '</div>' +
          '<p class="pim-card-text">' + escapeHtml(itemText(item)) + '</p>' +
          '</div>'
        ).join("") +
        '</div>' +
      '</section>'
    : "";

  bodyEl.innerHTML = badgesHtml + sourceHtml;
  modalEl.classList.remove("hidden");
}

function closePlanetInterpretationModal() {
  $("#planetModal")?.classList.add("hidden");
  $("#chartInnerModal")?.classList.add("hidden");
}

function initPlanetModal() {
  // Global modal
  $("#planetModalClose")?.addEventListener("click", closePlanetInterpretationModal);
  $("#planetModal")?.addEventListener("click", (event) => {
    if (event.target?.dataset?.modalClose) closePlanetInterpretationModal();
  });
  // Inner chart modal
  $("#chartInnerModalClose")?.addEventListener("click", closePlanetInterpretationModal);
  $("#chartInnerModalBackdrop")?.addEventListener("click", closePlanetInterpretationModal);

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if ($("#planetModal")?.classList.contains("hidden") && $("#chartInnerModal")?.classList.contains("hidden")) return;
    closePlanetInterpretationModal();
  });
}

function setSettingsModalStatus(text = "", tone = "") {
  const status = $("#settingsModalStatus");
  if (!status) return;
  status.textContent = text || "";
  status.classList.toggle("error", tone === "error");
}

function closeSettingsModal(force = false) {
  if (_settingsSetupMode && !force) return; // must save first
  _settingsSetupMode = false;
  $("#settingsModal")?.classList.add("hidden");
}

let _settingsSetupMode = false;

async function openSettingsModal(setupMode = false) {
  const modal = $("#settingsModal");
  if (!modal) return;
  _settingsSetupMode = setupMode;

  // Welcome banner — visible only in setup mode
  const welcome = $("#settingsWelcome");
  if (welcome) welcome.classList.toggle("hidden", !setupMode);


  // Cancel button — hide in setup mode
  const cancelBtn = $("#settingsCancelBtn");
  if (cancelBtn) cancelBtn.classList.toggle("hidden", setupMode);

  // Title
  const title = $("#settingsModalTitle");
  if (title) {
    title.textContent = setupMode
      ? (state.lang === "ru" ? "Добро пожаловать" : "Welcome")
      : tr("aiSettings");
  }

  modal.classList.remove("hidden");
  setSettingsModalStatus(tr("settingsLoading"));
  const apiKeyInput = $("#openrouterApiKey");
  const modelInput = $("#openrouterModel");
  try {
    const data = await api("/api/settings");
    const settings = data.settings || {};
    if (apiKeyInput) apiKeyInput.value = settings.openrouter_api_key || "";
    if (modelInput) modelInput.value = settings.openrouter_model || "";
    setSettingsModalStatus("");
  } catch (error) {
    setSettingsModalStatus(error.message || "Could not load settings.", "error");
  }
}

async function saveSettings(event) {
  event.preventDefault();
  const saveBtn = $("#settingsSaveBtn");
  const apiKeyInput = $("#openrouterApiKey");
  const modelInput = $("#openrouterModel");
  if (!saveBtn || !apiKeyInput || !modelInput) return;
  saveBtn.disabled = true;
  setSettingsModalStatus(tr("settingsSaving"));
  try {
    const data = await api("/api/settings", {
      method: "POST",
      body: JSON.stringify({
        openrouter_api_key: apiKeyInput.value,
        openrouter_model: modelInput.value,
      }),
    });
    const settings = data.settings || {};
    apiKeyInput.value = settings.openrouter_api_key || "";
    modelInput.value = settings.openrouter_model || "";
    setSettingsModalStatus(tr("settingsSaved"));
    setStatus(tr("settingsSaved"));
    if (_settingsSetupMode) {
      setTimeout(() => closeSettingsModal(true), 800);
    }
  } catch (error) {
    setSettingsModalStatus(error.message || "Could not save settings.", "error");
  } finally {
    saveBtn.disabled = false;
  }
}

function initDashaModal() {
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!$("#dashaDetailPanel")?.classList.contains("hidden")) closeDashaModal();
  });
}

function initSettingsModal() {
  $("#openSettingsBtn")?.addEventListener("click", openSettingsModal);
  $("#settingsModalClose")?.addEventListener("click", closeSettingsModal);
  $("#settingsCancelBtn")?.addEventListener("click", closeSettingsModal);
  $("#settingsModalBackdrop")?.addEventListener("click", closeSettingsModal);
  $("#settingsForm")?.addEventListener("submit", saveSettings);
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if ($("#settingsModal")?.classList.contains("hidden")) return;
    closeSettingsModal();
  });
}

function renderOverview(chart, context) {
  const current = chart.dashas?.current || {};
  const facts = [
    [tr("birth"), `${chart.birth.local_date} ${chart.birth.local_time}`],
    [tr("location"), `${chart.birth.city}, ${chart.birth.country} · ${chart.birth.timezone}`],
    ["UTC", chart.birth.utc_datetime],
    ["Julian Day", chart.birth.julian_day],
    [tr("settingsLabel"), `${chart.meta.ayanamsa}, ${chart.meta.zodiac}, ${chart.meta.house_system}, ${chart.meta.dasha_system}`],
    [tr("currentPeriod"), [current.mahadasha, current.antardasha, current.pratyantardasha].filter(Boolean).join(" / ")],
    [tr("warnings"), (chart.warnings || []).join("; ") || tr("noWarnings")],
  ];
  const sourcePreview = (context.items || [])
    .slice(0, 6)
    .map((item) => `<div class="source-item"><strong>${escapeHtml(item.key)}</strong><p>${escapeHtml(itemText(item))}</p></div>`)
    .join("");
  $("#overviewPanel").innerHTML = `
    <div class="overview-grid">
      <dl class="fact-list">
        ${facts.map(([label, value]) => `<div class="fact-row"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}
      </dl>
      <div class="overview-sources">${sourcePreview}</div>
    </div>
  `;
}

function renderTables(chart) {
  const isRu = state.lang === "ru";
  const PLANET_NAMES_RU = { sun:"Солнце", moon:"Луна", mars:"Марс", mercury:"Меркурий",
    jupiter:"Юпитер", venus:"Венера", saturn:"Сатурн", rahu:"Раху", ketu:"Кету" };
  const SIGN_RU_T = { Aries:"Овен", Taurus:"Телец", Gemini:"Близнецы", Cancer:"Рак",
    Leo:"Лев", Virgo:"Дева", Libra:"Весы", Scorpio:"Скорпион", Sagittarius:"Стрелец",
    Capricorn:"Козерог", Aquarius:"Водолей", Pisces:"Рыбы" };
  const DIGNITY_RU = { neutral:"нейтр.", exalted:"экзальт.", debilitated:"падение", own_sign:"свой знак" };
  const ELEMENT = { Aries:"fire", Taurus:"earth", Gemini:"air", Cancer:"water",
    Leo:"fire", Virgo:"earth", Libra:"air", Scorpio:"water",
    Sagittarius:"fire", Capricorn:"earth", Aquarius:"air", Pisces:"water" };

  const sl = (s) => (isRu && SIGN_RU_T[s]) ? SIGN_RU_T[s] : (s || "");
  const dl = (d) => (isRu && DIGNITY_RU[d]) ? DIGNITY_RU[d] : (d || "");

  // ── Planet cards ─────────────────────────────────────────
  const PLANET_ORDER_T = ["sun","moon","mars","mercury","jupiter","venus","saturn","rahu","ketu"];
  const planetCardsHtml = PLANET_ORDER_T.map((key) => {
    const p = chart.planets?.[key];
    if (!p) return "";
    const meta = PLANET_META[key] || { glyph: "?", color: "#888" };
    const name = isRu ? (PLANET_NAMES_RU[key] || p.name) : p.name;
    const elem = ELEMENT[p.sign] || "";
    const dignityClass = p.dignity === "exalted" ? "tbl-dignity--exalted"
      : p.dignity === "debilitated" ? "tbl-dignity--debilitated"
      : p.dignity === "own_sign" ? "tbl-dignity--own" : "tbl-dignity--neutral";
    const rulerHtml = (p.ruler_of_houses || []).map(h =>
      `<span class="tbl-ruler-badge">${h}</span>`).join("");

    return `<div class="tbl-planet-card" style="--pcol:${meta.color}">
      <div class="tbl-pc-top">
        <span class="tbl-pc-glyph">${meta.glyph}</span>
        <span class="tbl-pc-name">${escapeHtml(name)}</span>
        ${p.retrograde ? `<span class="tbl-retro">R</span>` : ""}
        <span class="tbl-pc-deg">${escapeHtml(p.degree_formatted)}</span>
      </div>
      <div class="tbl-pc-sign tbl-elem--${elem}">
        <span>${escapeHtml(sl(p.sign))}</span>
        <span class="tbl-pc-house">${isRu ? "дом" : "house"} ${p.house}</span>
      </div>
      <div class="tbl-pc-nk">${escapeHtml(p.nakshatra)} <span class="tbl-pc-pada">${isRu ? "п." : "p."}${p.pada}</span></div>
      <div class="tbl-pc-bottom">
        <span class="tbl-dignity ${dignityClass}">${escapeHtml(dl(p.dignity))}</span>
        ${rulerHtml ? `<span class="tbl-ruler-label">${isRu?"упр.":"rules"}</span>${rulerHtml}` : ""}
      </div>
    </div>`;
  }).join("");

  $("#planetTable").innerHTML = `<div class="tbl-planet-grid">${planetCardsHtml}</div>`;

  // ── House rows ────────────────────────────────────────────
  const houseRowsHtml = Object.values(chart.houses || {})
    .sort((a, b) => a.number - b.number)
    .map((h) => {
      const elem = ELEMENT[h.sign] || "";
      const planetsInHouse = (h.planets || []);
      const planetBadges = planetsInHouse.map((pn) => {
        const pk = pn.toLowerCase();
        const m = PLANET_META[pk] || { glyph: pn[0], color: "#888" };
        return `<span class="tbl-house-planet" style="--pcol:${m.color}">${m.glyph}</span>`;
      }).join("");
      return `<div class="tbl-house-row${planetsInHouse.length ? " tbl-house-row--occupied" : ""}">
        <div class="tbl-house-num">${h.number}</div>
        <div class="tbl-house-sign tbl-elem--${elem}">${escapeHtml(sl(h.sign))}</div>
        <div class="tbl-house-lord">${escapeHtml(isRu ? (PLANET_NAMES_RU[h.lord?.toLowerCase()] || h.lord) : h.lord)}</div>
        <div class="tbl-house-planets">${planetBadges || '<span class="tbl-empty">—</span>'}</div>
      </div>`;
    }).join("");

  $("#houseTable").innerHTML = `
    <div class="tbl-house-header">
      <span>${isRu?"Дом":"House"}</span>
      <span>${isRu?"Знак":"Sign"}</span>
      <span>${isRu?"Управитель":"Lord"}</span>
      <span>${isRu?"Планеты":"Planets"}</span>
    </div>
    <div class="tbl-house-list">${houseRowsHtml}</div>`;

  // ── Aspect rows ───────────────────────────────────────────
  const aspectRowsHtml = (chart.aspects || []).map((asp) => {
    const fromKey = asp.from_planet?.toLowerCase();
    const meta = PLANET_META[fromKey] || { glyph: "?", color: "#888" };
    const fromName = isRu ? (PLANET_NAMES_RU[fromKey] || asp.from_planet) : asp.from_planet;
    const toSign = sl(asp.to_sign);
    const elem = ELEMENT[asp.to_sign] || "";
    return `<div class="tbl-aspect-row">
      <div class="tbl-asp-from" style="--pcol:${meta.color}">
        <span class="tbl-asp-glyph">${meta.glyph}</span>
        <span class="tbl-asp-name">${escapeHtml(fromName)}</span>
        <span class="tbl-asp-house">${asp.from_house}</span>
      </div>
      <div class="tbl-asp-arrow">→</div>
      <div class="tbl-asp-type">${escapeHtml(asp.aspect)}</div>
      <div class="tbl-asp-to">
        <span class="tbl-asp-house">${asp.to_house}</span>
        <span class="tbl-asp-sign tbl-elem--${elem}">${escapeHtml(toSign)}</span>
      </div>
    </div>`;
  }).join("");

  $("#aspectTable").innerHTML = `<div class="tbl-aspect-list">${aspectRowsHtml}</div>`;
}

function renderDashas(chart) {
  const mahadashas = chart.dashas?.mahadashas || [];
  const antardasha_map = {};
  (chart.dashas?.antardashas || []).forEach((a) => {
    if (!antardasha_map[a.mahadasha]) antardasha_map[a.mahadasha] = [];
    antardasha_map[a.mahadasha].push(a);
  });

  if (!mahadashas.length) {
    $("#dashaTable").innerHTML = `<p class="lp-empty">No dasha data</p>`;
    return;
  }

  const now = new Date();
  const birthDate = new Date(mahadashas[0].start);
  const lifeEnd = new Date(birthDate);
  lifeEnd.setFullYear(lifeEnd.getFullYear() + 120);
  const lifeSpanMs = lifeEnd - birthDate;

  const currentMaha = mahadashas.find((m) => {
    const s = new Date(m.start), e = new Date(m.end);
    return now >= s && now <= e;
  });

  function pct(date) {
    return Math.max(0, Math.min(100, ((new Date(date) - birthDate) / lifeSpanMs) * 100));
  }

  function ageAt(date) {
    const d = new Date(date);
    const diff = d - birthDate;
    return Math.round(diff / (365.25 * 24 * 3600 * 1000));
  }

  const nowPct = pct(now);
  const scaleAges = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

  const segmentsHtml = mahadashas.map((m, i) => {
    const pKey = m.planet.toLowerCase();
    const meta = PLANET_META[pKey] || { glyph: "?", color: "#888", label: m.planet };
    const interp = DASHA_INTERP[pKey];
    const startPct = pct(m.start);
    const endPct = pct(m.end);
    const widthPct = endPct - startPct;
    const isCurrent = currentMaha && m.planet === currentMaha.planet && m.start === currentMaha.start;
    const startAge = ageAt(m.start);
    const endAge = ageAt(m.end);
    const labelInsidePct = widthPct > 2.5;

    return `<div
      class="lp-segment${isCurrent ? " lp-current" : ""}"
      style="left:${startPct.toFixed(3)}%;width:${widthPct.toFixed(3)}%;--planet-color:${meta.color}"
      data-planet="${escapeHtml(pKey)}"
      data-idx="${i}"
      title="${escapeHtml(meta.label)} · ${startAge}–${endAge} ${tr("lifePathAge")}"
      role="button"
      tabindex="0"
      aria-label="Mahadasha ${escapeHtml(meta.label)}"
    >
      <div class="lp-segment-fill"></div>
      ${labelInsidePct ? `<div class="lp-segment-label${widthPct < 5 ? " lp-label-tiny" : ""}">
        <span class="lp-glyph">${meta.glyph}</span>
        <span class="lp-planet-name">${escapeHtml(meta.label)}</span>
      </div>` : `<div class="lp-segment-label lp-label-small lp-label-tiny">
        <span class="lp-glyph">${meta.glyph}</span>
        <span class="lp-planet-name">${escapeHtml(meta.label)}</span>
      </div>`}
      ${isCurrent ? `<div class="lp-current-badge">${escapeHtml(tr("lifePathNow"))}</div>` : ""}
    </div>`;
  }).join("");

  const yearTicksHtml = scaleAges.map((age) => {
    const tickDate = new Date(birthDate);
    tickDate.setFullYear(tickDate.getFullYear() + age);
    const p = pct(tickDate);
    return `<div class="lp-tick lp-tick--year" style="left:${p.toFixed(2)}%">
      <div class="lp-tick-line"></div>
      <span class="lp-tick-label">${tickDate.getFullYear()}</span>
    </div>`;
  }).join("");

  const ageTicksHtml = scaleAges.map((age) => {
    const tickDate = new Date(birthDate);
    tickDate.setFullYear(tickDate.getFullYear() + age);
    const p = pct(tickDate);
    return `<div class="lp-tick" style="left:${p.toFixed(2)}%">
      <div class="lp-tick-line"></div>
      <span class="lp-tick-label">${age === 0 ? tr("lifePathBirth") : age}</span>
    </div>`;
  }).join("");

  const nowMarkerHtml = now >= birthDate && now <= lifeEnd
    ? `<div class="lp-now-marker" style="left:${nowPct.toFixed(3)}%" title="${tr("lifePathNow")}">
        <div class="lp-now-line"></div>
        <div class="lp-now-dot"></div>
      </div>`
    : "";

  $("#dashaTable").innerHTML = `
    <div class="life-path-wrap">
      <div class="lp-track-outer">
        <div class="lp-ticks lp-ticks--years">${yearTicksHtml}</div>
        <div class="lp-track" role="list">
          ${segmentsHtml}
          ${nowMarkerHtml}
        </div>
        <div class="lp-ticks">${ageTicksHtml}</div>
      </div>
      <div class="lp-legend">
        ${mahadashas.map((m) => {
          const pKey = m.planet.toLowerCase();
          const meta = PLANET_META[pKey] || { glyph: "?", color: "#888", label: m.planet };
          const isCurrent = currentMaha && m.planet === currentMaha.planet && m.start === currentMaha.start;
          return `<button class="lp-legend-item${isCurrent ? " lp-current" : ""}" data-planet="${escapeHtml(pKey)}" data-idx="${mahadashas.indexOf(m)}" style="--planet-color:${meta.color}">
            <span class="lp-legend-glyph">${meta.glyph}</span>
            <span class="lp-legend-name">${escapeHtml(meta.label)}</span>
            <span class="lp-legend-years">${m.duration_years} ${tr("lifePathAge")}</span>
          </button>`;
        }).join("")}
      </div>
    </div>
  `;

  $("#dashaTable").querySelectorAll(".lp-segment, .lp-legend-item").forEach((el) => {
    el.addEventListener("click", () => openDashaModal(mahadashas, antardasha_map, parseInt(el.dataset.idx)));
    el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDashaModal(mahadashas, antardasha_map, parseInt(el.dataset.idx)); } });
  });

}

function openDashaModal(mahadashas, antardasha_map, idx) {
  const m = mahadashas[idx];
  if (!m) return;
  const pKey = m.planet.toLowerCase();
  const meta = PLANET_META[pKey] || { glyph: "?", color: "#888", label: m.planet };
  const interp = DASHA_INTERP[pKey];
  const txt = interp ? interp[state.lang] || interp.en : null;
  const antars = antardasha_map[m.planet] || [];

  const now = new Date();
  const isActive = now >= new Date(m.start) && now <= new Date(m.end);

  const currentAntar = antars.find((a) => now >= new Date(a.start) && now <= new Date(a.end));

  const themesHtml = txt ? txt.themes.map((th) => `<li>${escapeHtml(th)}</li>`).join("") : "";

  const antarHtml = antars.length ? `
    <div class="dm-section dm-section-full">
      <h4 class="dm-section-title">${escapeHtml(tr("dashaModalAntardasha"))}</h4>
      <div class="dm-antar-list">
        ${antars.map((a) => {
          const apKey = a.antardasha.toLowerCase();
          const aMeta = PLANET_META[apKey] || { glyph: "?", color: "#888", label: a.antardasha };
          const isCurrentAntar = currentAntar && a.antardasha === currentAntar.antardasha;
          const elapsed = isCurrentAntar ? Math.max(0, (now - new Date(a.start)) / (new Date(a.end) - new Date(a.start))) : 0;
          return `<div class="dm-antar-item${isCurrentAntar ? " dm-antar-active" : ""}" style="--aplanet-color:${aMeta.color}">
            <div class="dm-antar-head">
              <span class="dm-antar-glyph">${aMeta.glyph}</span>
              <span class="dm-antar-name">${escapeHtml(aMeta.label)}</span>
              ${isCurrentAntar ? `<span class="dm-antar-now">${escapeHtml(tr("lifePathNow"))}</span>` : ""}
              <span class="dm-antar-dates">${formatDate(a.start)} — ${formatDate(a.end)}</span>
            </div>
            ${isCurrentAntar ? `<div class="dm-antar-progress"><div class="dm-antar-bar" style="width:${(elapsed * 100).toFixed(1)}%"></div></div>` : ""}
          </div>`;
        }).join("")}
      </div>
    </div>` : "";

  const interpHtml = txt ? `
    <div class="dm-essence">${escapeHtml(txt.essence)}</div>
    <div class="dm-sections">
      ${themesHtml ? `<div class="dm-section">
        <h4 class="dm-section-title">${escapeHtml(tr("dashaModalThemes"))}</h4>
        <ul class="dm-themes">${themesHtml}</ul>
      </div>` : ""}
      <div class="dm-section">
        <h4 class="dm-section-title">${escapeHtml(tr("dashaModalFavorable"))}</h4>
        <p>${escapeHtml(txt.favorable)}</p>
      </div>
      <div class="dm-section">
        <h4 class="dm-section-title">${escapeHtml(tr("dashaModalChallenging"))}</h4>
        <p>${escapeHtml(txt.challenging)}</p>
      </div>
      <div class="dm-section">
        <h4 class="dm-section-title">${escapeHtml(tr("dashaModalSpiritual"))}</h4>
        <p>${escapeHtml(txt.spiritual)}</p>
      </div>
    </div>
    ${antarHtml}
    <div class="dm-anter-note">
      <strong>${escapeHtml(tr("dashaModalAntarNote"))}:</strong> ${escapeHtml(txt.antardasha_note)}
    </div>
  ` : `<p class="dm-no-interp">No interpretation available.</p>${antarHtml}`;

  const prevIdx = idx > 0 ? idx - 1 : null;
  const nextIdx = idx < mahadashas.length - 1 ? idx + 1 : null;

  const panel = $("#dashaDetailPanel");
  const inner = $("#dashaDetailInner");

  panel.style.setProperty("--modal-planet-color", meta.color);
  inner.innerHTML = `
    <div class="dm-head">
      <div class="dm-identity">
        <span class="dasha-modal-glyph">${meta.glyph}</span>
        <div class="dasha-modal-title-block">
          <h3 id="dashaModalTitle">${escapeHtml(txt ? txt.title : meta.label)}</h3>
          <div class="dasha-modal-meta">
            <span>${escapeHtml(tr("dashaModalStart"))}: <strong>${escapeHtml(formatDate(m.start))}</strong></span>
            <span>${escapeHtml(tr("dashaModalEnd"))}: <strong>${escapeHtml(formatDate(m.end))}</strong></span>
            <span>${escapeHtml(tr("dashaModalDuration"))}: <strong>${m.duration_years} ${escapeHtml(tr("lifePathAge"))}</strong></span>
            ${isActive ? `<span class="dm-active-badge">${escapeHtml(tr("lifePathNow"))}</span>` : ""}
          </div>
        </div>
      </div>
      <div class="dm-head-actions">
        <button class="dm-nav-btn" id="dmPrev" type="button" aria-label="Previous" ${prevIdx === null ? "disabled" : ""}>&#8592;</button>
        <button class="dm-nav-btn" id="dmNext" type="button" aria-label="Next" ${nextIdx === null ? "disabled" : ""}>&#8594;</button>
        <button class="dm-close-btn" id="dmClose" type="button" aria-label="Close">&#215;</button>
      </div>
    </div>
    <div class="dasha-modal-body">${interpHtml}</div>
  `;

  inner.querySelector("#dmPrev")?.addEventListener("click", () => openDashaModal(mahadashas, antardasha_map, prevIdx));
  inner.querySelector("#dmNext")?.addEventListener("click", () => openDashaModal(mahadashas, antardasha_map, nextIdx));
  inner.querySelector("#dmClose")?.addEventListener("click", closeDashaModal);

  panel.classList.remove("hidden");

  $$(".lp-segment, .lp-legend-item").forEach((el) => el.classList.remove("lp-selected"));
  $$(`[data-idx="${idx}"]`).forEach((el) => el.classList.add("lp-selected"));

  panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function closeDashaModal() {
  $("#dashaDetailPanel")?.classList.add("hidden");
  $$(".lp-segment, .lp-legend-item").forEach((el) => el.classList.remove("lp-selected"));
}

function renderSources(context) {
  const isRu = state.lang === "ru";
  const items = context.items || [];

  // ── helpers ──────────────────────────────────────────────
  const PLANET_ORDER = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu"];
  const SIGN_RU_SRC = { Aries:"Овен", Taurus:"Телец", Gemini:"Близнецы", Cancer:"Рак", Leo:"Лев",
    Virgo:"Дева", Libra:"Весы", Scorpio:"Скорпион", Sagittarius:"Стрелец",
    Capricorn:"Козерог", Aquarius:"Водолей", Pisces:"Рыбы" };

  const signLabel = (s) => (isRu && SIGN_RU_SRC[s]) ? SIGN_RU_SRC[s] : (s || "");
  const tagType = (key) => {
    if (key.includes(":nakshatra:") && key.includes(":pada:")) return "pada";
    if (key.includes(":nakshatra:")) return "nakshatra";
    if (key.includes(":sign:")) return "sign";
    if (key.includes(":house:") || key.match(/house:\d+$/)) return "house";
    if (key.includes(":lord:")) return "lord";
    if (key.includes(":mahadasha") || key.includes(":antardasha")) return "dasha";
    return "base";
  };
  const TAG_LABELS = {
    ru:  { base:"Суть", sign:"Знак", nakshatra:"Накшатра", pada:"Пада", house:"Дом", lord:"Лорд", dasha:"Даша" },
    en:  { base:"Core", sign:"Sign", nakshatra:"Nakshatra", pada:"Pada", house:"House", lord:"Lord", dasha:"Dasha" },
  };
  const tagLabel = (key) => (TAG_LABELS[state.lang] || TAG_LABELS.ru)[tagType(key)] || tagType(key);

  const row = (item) =>
    `<div class="src-row">
      <span class="src-tag src-tag--${escapeHtml(tagType(item.key))}">${escapeHtml(tagLabel(item.key))}</span>
      <span class="src-text">${escapeHtml(itemText(item))}</span>
    </div>`;

  // ── Lagna block ───────────────────────────────────────────
  const lagnaItems = items.filter(i => i.key.startsWith("lagna:"));
  const lagnaHtml = lagnaItems.length ? `
    <div class="src-section">
      <div class="src-section-head">
        <span class="src-section-icon">⬆</span>
        <span class="src-section-title">${isRu ? "Лагна" : "Lagna"}</span>
        ${state.chart?.lagna ? `<span class="src-section-sub">${escapeHtml(signLabel(state.chart.lagna.sign))} · ${escapeHtml(state.chart.lagna.nakshatra || "")}</span>` : ""}
      </div>
      <div class="src-card src-card--wide">${lagnaItems.map(row).join("")}</div>
    </div>` : "";

  // ── Planets block ─────────────────────────────────────────
  const planetItems = items.filter(i => i.key.startsWith("planet:"));
  const byPlanet = {};
  planetItems.forEach(i => {
    const p = i.key.split(":")[1];
    if (!byPlanet[p]) byPlanet[p] = [];
    byPlanet[p].push(i);
  });

  const planetCardsHtml = PLANET_ORDER.filter(p => byPlanet[p]?.length).map(p => {
    const meta = PLANET_META[p] || { glyph: "?", color: "#888", label: p };
    const chartPlanet = state.chart?.planets?.[p];
    const sub = chartPlanet
      ? `${escapeHtml(signLabel(chartPlanet.sign))} · ${isRu ? "дом" : "house"} ${chartPlanet.house}`
      : "";
    return `<div class="src-card" style="--src-color:${meta.color}">
      <div class="src-card-head">
        <span class="src-card-glyph">${meta.glyph}</span>
        <span class="src-card-name">${escapeHtml(isRu ? ({"sun":"Солнце","moon":"Луна","mars":"Марс","mercury":"Меркурий","jupiter":"Юпитер","venus":"Венера","saturn":"Сатурн","rahu":"Раху","ketu":"Кету"})[p] || meta.label : meta.label)}</span>
        ${sub ? `<span class="src-card-sub">${sub}</span>` : ""}
      </div>
      ${byPlanet[p].map(row).join("")}
    </div>`;
  }).join("");

  const planetsHtml = planetCardsHtml ? `
    <div class="src-section">
      <div class="src-section-head">
        <span class="src-section-icon">✦</span>
        <span class="src-section-title">${isRu ? "Планеты" : "Planets"}</span>
      </div>
      <div class="src-grid">${planetCardsHtml}</div>
    </div>` : "";

  // ── Houses block ──────────────────────────────────────────
  const houseItems = items.filter(i => i.key.startsWith("house:"));
  const byHouse = {};
  houseItems.forEach(i => {
    const h = i.key.split(":")[1];
    if (!byHouse[h]) byHouse[h] = [];
    byHouse[h].push(i);
  });

  const houseCardsHtml = Object.keys(byHouse).sort((a,b) => +a - +b).map(h => {
    const chartHouse = state.chart?.houses?.[h];
    const sub = chartHouse
      ? `${escapeHtml(signLabel(chartHouse.sign))} · ${escapeHtml(chartHouse.lord || "")}`
      : "";
    return `<div class="src-card src-card--house">
      <div class="src-card-head">
        <span class="src-card-num">${h}</span>
        ${sub ? `<span class="src-card-sub">${sub}</span>` : ""}
      </div>
      ${byHouse[h].map(row).join("")}
    </div>`;
  }).join("");

  const housesHtml = houseCardsHtml ? `
    <div class="src-section">
      <div class="src-section-head">
        <span class="src-section-icon">⬡</span>
        <span class="src-section-title">${isRu ? "Дома" : "Houses"}</span>
      </div>
      <div class="src-grid src-grid--houses">${houseCardsHtml}</div>
    </div>` : "";

  // ── Dasha block ───────────────────────────────────────────
  const dashaItems = items.filter(i => i.key.startsWith("dasha:"));
  const dashaHtml = dashaItems.length ? `
    <div class="src-section">
      <div class="src-section-head">
        <span class="src-section-icon">◑</span>
        <span class="src-section-title">${isRu ? "Даша" : "Dasha"}</span>
      </div>
      <div class="src-card src-card--wide">${dashaItems.map(row).join("")}</div>
    </div>` : "";

  // ── D9 Navamsa block ──────────────────────────────────────
  const d9Items = items.filter(i => i.key.startsWith("d9:"));
  const byD9Planet = {};
  d9Items.forEach(i => {
    const p = i.key.split(":")[1];
    if (!byD9Planet[p]) byD9Planet[p] = [];
    byD9Planet[p].push(i);
  });
  const d9CardsHtml = PLANET_ORDER.filter(p => byD9Planet[p]?.length).map(p => {
    const meta = PLANET_META[p] || { glyph: "?", color: "#888", label: p };
    const PLANET_NAMES_RU = { sun:"Солнце", moon:"Луна", mars:"Марс", mercury:"Меркурий",
      jupiter:"Юпитер", venus:"Венера", saturn:"Сатурн", rahu:"Раху", ketu:"Кету" };
    const d9Planet = state.chart?.divisional_charts?.D9?.planets?.[p];
    const sub = d9Planet ? escapeHtml(signLabel(d9Planet.sign)) : "";
    return `<div class="src-card" style="--src-color:${meta.color}">
      <div class="src-card-head">
        <span class="src-card-glyph">${meta.glyph}</span>
        <span class="src-card-name">${escapeHtml(isRu ? (PLANET_NAMES_RU[p] || meta.label) : meta.label)}</span>
        ${sub ? `<span class="src-card-sub">${sub}</span>` : ""}
      </div>
      ${byD9Planet[p].map(row).join("")}
    </div>`;
  }).join("");
  const d9Html = d9CardsHtml ? `
    <div class="src-section">
      <div class="src-section-head">
        <span class="src-section-icon">◉</span>
        <span class="src-section-title">${isRu ? "D9 Навамша" : "D9 Navamsa"}</span>
      </div>
      <div class="src-grid">${d9CardsHtml}</div>
    </div>` : "";

  // ── Aspects block ─────────────────────────────────────────
  const aspectItems = items.filter(i => i.key.startsWith("aspect:"));
  const byAspectPlanet = {};
  aspectItems.forEach(i => {
    const p = i.key.split(":")[1];
    if (!byAspectPlanet[p]) byAspectPlanet[p] = [];
    byAspectPlanet[p].push(i);
  });
  const PLANET_NAMES_RU_A = { sun:"Солнце", moon:"Луна", mars:"Марс", mercury:"Меркурий",
    jupiter:"Юпитер", venus:"Венера", saturn:"Сатурн", rahu:"Раху", ketu:"Кету" };
  const aspectCardsHtml = PLANET_ORDER.filter(p => byAspectPlanet[p]?.length).map(p => {
    const meta = PLANET_META[p] || { glyph: "?", color: "#888", label: p };
    return `<div class="src-card" style="--src-color:${meta.color}">
      <div class="src-card-head">
        <span class="src-card-glyph">${meta.glyph}</span>
        <span class="src-card-name">${escapeHtml(isRu ? (PLANET_NAMES_RU_A[p] || meta.label) : meta.label)}</span>
      </div>
      ${byAspectPlanet[p].map(row).join("")}
    </div>`;
  }).join("");
  const aspectsHtml = aspectCardsHtml ? `
    <div class="src-section">
      <div class="src-section-head">
        <span class="src-section-icon">⟡</span>
        <span class="src-section-title">${isRu ? "Аспекты" : "Aspects"}</span>
      </div>
      <div class="src-grid">${aspectCardsHtml}</div>
    </div>` : "";

  // ── Nakshatra block ───────────────────────────────────────
  const nakshatraItems = items.filter(i => i.key.startsWith("nakshatra:"));
  const nakshatraHtml = nakshatraItems.length ? `
    <div class="src-section">
      <div class="src-section-head">
        <span class="src-section-icon">✦</span>
        <span class="src-section-title">${isRu ? "Накшатры" : "Nakshatras"}</span>
      </div>
      <div class="src-card src-card--wide">${nakshatraItems.map(row).join("")}</div>
    </div>` : "";

  // ── True "other" (anything not yet categorised) ───────────
  const knownPrefixes = ["lagna", "planet", "house", "dasha", "d9", "aspect", "nakshatra"];
  const otherItems = items.filter(i => !knownPrefixes.includes(i.key.split(":")[0]));
  const otherHtml = otherItems.length ? `
    <div class="src-section">
      <div class="src-section-head">
        <span class="src-section-icon">◈</span>
        <span class="src-section-title">${isRu ? "Прочее" : "Other"}</span>
      </div>
      <div class="src-card src-card--wide">${otherItems.map(row).join("")}</div>
    </div>` : "";

  $("#sourceList").innerHTML = lagnaHtml + planetsHtml + housesHtml + dashaHtml + d9Html + aspectsHtml + nakshatraHtml + otherHtml;

  const missing = context.missing || [];
  const detailsEl = $("#missingSourcesDetails");
  if (detailsEl) detailsEl.style.display = missing.length ? "" : "none";
  const countEl = $("#missingCount");
  if (countEl) countEl.textContent = missing.length ? `(${missing.length})` : "";
  $("#missingList").innerHTML = missing
    .map((item) => `<div class="source-item"><strong>${escapeHtml(item.key)}</strong></div>`)
    .join("");
}

function renderReport(run, markdown) {
  const btn = $("#exportDownloadBtn");
  if (!btn) return;
  btn.href = `/api/export/${run.id}`;
  const chart = state.chart;
  const name = (chart?.birth?.name || "chart").replace(/[^a-zа-яёА-ЯЁ0-9_-]/gi, "_");
  btn.download = `${name}_jyotish.md`;
  const meta = $("#exportMeta");
  if (meta && chart) {
    const b = chart.birth || {};
    meta.textContent = `${b.name || ""} · ${b.local_date || ""} · ${b.city || ""}, ${b.country || ""}`;
  }
}

function table(headers, rows) {
  return `
    <table>
      <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
      <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>
  `;
}

function markdownToHtml(markdown) {
  const lines = String(markdown || "").replace(/\r\n?/g, "\n").split("\n");
  const blocks = [];

  const isBlank = (line) => !String(line || "").trim();
  const isHeading = (line) => /^#{1,6}\s+/.test(line);
  const isHr = (line) => /^(\*\s*\*\s*\*|-{3,}|_{3,})\s*$/.test(line.trim());
  const isFence = (line) => /^```/.test(line.trim());
  const isTableRow = (line) => /^\s*\|.*\|\s*$/.test(line);
  const isListItem = (line) => /^\s*(?:[-*+]|[0-9]+\.)\s+/.test(line);
  const isBlockStart = (line) => isHeading(line) || isHr(line) || isFence(line) || isTableRow(line) || isListItem(line) || /^>\s?/.test(line);

  function renderInline(text) {
    const codeSegments = [];
    let html = String(text || "");
    html = html.replace(/`([^`]+)`/g, (_, code) => {
      codeSegments.push(escapeHtml(code));
      return `\u0000${codeSegments.length - 1}\u0000`;
    });
    html = escapeHtml(html);
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|mailto:[^)\s]+|\/[^)\s]+)\)/g, (_, label, href) => {
      const safeHref = escapeHtml(href);
      return `<a href="${safeHref}" target="_blank" rel="noreferrer noopener">${label}</a>`;
    });
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");
    html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");
    html = html.replace(/\u0000(\d+)\u0000/g, (_, index) => `<code>${codeSegments[Number(index)] || ""}</code>`);
    return html;
  }

  function parseTable(startIndex) {
    const rows = [];
    let index = startIndex;
    while (index < lines.length) {
      const current = lines[index];
      if (isBlank(current)) {
        let lookahead = index + 1;
        while (lookahead < lines.length && isBlank(lines[lookahead])) lookahead += 1;
        if (lookahead < lines.length && isTableRow(lines[lookahead])) {
          index = lookahead;
          continue;
        }
        break;
      }
      if (!isTableRow(current)) break;
      rows.push(current);
      index += 1;
    }
    if (!rows.length) return { html: "", nextIndex: startIndex + 1 };
    const parsedRows = rows
      .map((row) => row.trim().slice(1, -1).split("|").map((cell) => cell.trim()))
      .filter((row) => row.some((cell) => cell.length));
    if (!parsedRows.length) return { html: "", nextIndex: index };
    const hasSeparator = parsedRows.length > 1 && parsedRows[1].every((cell) => /^:?-{3,}:?$/.test(cell));
    const header = hasSeparator ? parsedRows[0] : parsedRows[0];
    const body = hasSeparator ? parsedRows.slice(2) : parsedRows.slice(1);
    const alignments = (hasSeparator ? parsedRows[1] : header).map((cell) => {
      if (/^:-{3,}:$/.test(cell)) return "center";
      if (/^:-{3,}$/.test(cell)) return "left";
      if (/^-{3,}:$/.test(cell)) return "right";
      return "";
    });
    const headHtml = header
      .map((cell, index) => {
        const align = alignments[index];
        const style = align ? ` style="text-align:${align}"` : "";
        return `<th${style}>${renderInline(cell)}</th>`;
      })
      .join("");
    const bodyHtml = body
      .map(
        (row) =>
          `<tr>${row
            .map((cell, index) => {
              const align = alignments[index];
              const style = align ? ` style="text-align:${align}"` : "";
              return `<td${style}>${renderInline(cell)}</td>`;
            })
            .join("")}</tr>`
      )
      .join("");
    return {
      html: `
        <table>
          <thead><tr>${headHtml}</tr></thead>
          <tbody>${bodyHtml}</tbody>
        </table>
      `,
      nextIndex: index,
    };
  }

  function collectParagraph(startIndex) {
    const parts = [];
    let index = startIndex;
    while (index < lines.length) {
      const current = lines[index];
      if (isBlank(current)) {
        let lookahead = index + 1;
        while (lookahead < lines.length && isBlank(lines[lookahead])) lookahead += 1;
        if (lookahead < lines.length && !isBlockStart(lines[lookahead])) {
          parts.push("");
          index = lookahead;
          continue;
        }
        break;
      }
      if (isBlockStart(current)) break;
      parts.push(current.trim());
      index += 1;
    }
    const text = parts.filter((part) => part.length).join(" ");
    return { html: text ? `<p>${renderInline(text)}</p>` : "", nextIndex: index };
  }

  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (isBlank(line)) {
      index += 1;
      continue;
    }
    if (isFence(line)) {
      const fence = line.trim().slice(0, 3);
      const code = [];
      index += 1;
      while (index < lines.length && lines[index].trim() !== fence) {
        code.push(lines[index]);
        index += 1;
      }
      if (index < lines.length && lines[index].trim() === fence) index += 1;
      blocks.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
      continue;
    }
    if (isHeading(line)) {
      const match = line.match(/^(#{1,6})\s+(.*)$/);
      const level = Math.min(match[1].length, 6);
      blocks.push(`<h${level}>${renderInline(match[2])}</h${level}>`);
      index += 1;
      continue;
    }
    if (isHr(line)) {
      blocks.push("<hr />");
      index += 1;
      continue;
    }
    if (/^>\s?/.test(line)) {
      const quote = [];
      while (index < lines.length) {
        const current = lines[index];
        if (!/^>\s?/.test(current)) break;
        quote.push(current.replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push(`<blockquote>${markdownToHtml(quote.join("\n"))}</blockquote>`);
      continue;
    }
    if (isTableRow(line)) {
      const table = parseTable(index);
      if (table.html) blocks.push(table.html);
      index = table.nextIndex;
      continue;
    }
    if (isListItem(line)) {
      const items = [];
      const ordered = /^\s*[0-9]+\.\s+/.test(line);
      while (index < lines.length) {
        const current = lines[index];
        if (isBlank(current)) {
          let lookahead = index + 1;
          while (lookahead < lines.length && isBlank(lines[lookahead])) lookahead += 1;
          if (lookahead < lines.length && isListItem(lines[lookahead])) {
            index = lookahead;
            continue;
          }
          break;
        }
        if (!isListItem(current)) break;
        items.push(current.replace(/^\s*(?:[-*+]|[0-9]+\.)\s+/, ""));
        index += 1;
      }
      blocks.push(
        `<${ordered ? "ol" : "ul"}>${items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</${ordered ? "ol" : "ul"}>`
      );
      continue;
    }
    const paragraph = collectParagraph(index);
    if (paragraph.html) blocks.push(paragraph.html);
    index = paragraph.nextIndex > index ? paragraph.nextIndex : index + 1;
  }

  return blocks.join("");
}

async function searchPlaces() {
  const q = $("#placeQuery").value.trim();
  const box = $("#placeSuggestions");
  if (q.length < 2) {
    box.style.display = "none";
    return;
  }
  const data = await api(`/api/places?q=${encodeURIComponent(q)}`);
  box.innerHTML = (data.places || [])
    .map(
      (place) => `
        <button class="suggestion" type="button" data-place='${escapeHtml(JSON.stringify(place))}'>
          ${escapeHtml(place.name)}
          <span>${escapeHtml(place.latitude)}, ${escapeHtml(place.longitude)} · ${escapeHtml(place.timezone)}</span>
        </button>
      `
    )
    .join("");
  box.style.display = box.innerHTML ? "block" : "none";
  $$(".suggestion").forEach((button) => {
    button.addEventListener("click", () => {
      const place = JSON.parse(button.dataset.place);
      const [city, ...countryParts] = place.key.split(",");
      const form = $("#birthForm");
      form.city.value = titleCase(city);
      form.country.value = titleCase(countryParts.join(","));
      form.latitude.value = place.latitude;
      form.longitude.value = place.longitude;
      form.timezone.value = place.timezone;
      $("#placeQuery").value = place.name;
      box.style.display = "none";
    });
  });
}

async function askQuestion(event) {
  event.preventDefault();
  const input = $("#chatQuestion");
  const question = input.value.trim();
  if (!question || !state.currentRunId) return;
  addMessage("user", question);
  input.value = "";
  const pending = addMessage("assistant", state.lang === "ru" ? "Думаю по рассчитанной карте..." : "Reading the calculated chart...");
  pending.classList.add("loading");
  try {
    const data = await api("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        run_id: state.currentRunId,
        profile_id: state.currentProfileId,
        question,
        language: state.lang,
      }),
    });
    pending.classList.remove("loading");
    const content = pending.querySelector(".message-content");
    if (content) content.innerHTML = markdownToHtml(data.answer || "");
    if (Array.isArray(data.chat_history)) {
      updateCurrentProfileChat(data.chat_history);
    }
    renderFollowUps();
  } catch (error) {
    pending.classList.remove("loading");
    const content = pending.querySelector(".message-content");
    if (content) content.innerHTML = `<p>${escapeHtml(error.message.includes("OPENROUTER_API_KEY") ? tr("missingApiKey") : error.message)}</p>`;
  }
}

function renderChatHistory(messages) {
  const log = $("#chatLog");
  const history = Array.isArray(messages) ? messages : [];
  if (!history.length) {
    log.innerHTML = "";
    return;
  }
  log.innerHTML = "";
  history.forEach((message) => addMessage(message.role, message.content || "", { persist: false }));
}

function updateCurrentProfileChat(chatHistory) {
  const profile = state.profiles.find((item) => item.id === state.currentProfileId);
  if (profile) profile.chat_history = chatHistory;
}

async function clearChat() {
  if (!state.currentProfileId) return;
  if (!confirm(tr("clearChatConfirm"))) return;
  try {
    const data = await api(`/api/profiles/${state.currentProfileId}/chat`, { method: "DELETE" });
    updateCurrentProfileChat(data.chat_history || []);
    renderChatHistory([]);
  } catch (error) {
    alert(error.message);
  }
}

function renderFollowUps() {
  const log = $("#chatLog");
  log.querySelector(".followups")?.remove();
  const node = document.createElement("div");
  node.className = "followups";
  const items = [
    ["followUpTiming", "promptDashaText"],
    ["followUpHouses", "promptStrengthsText"],
    ["followUpSources", "followUpSources"],
  ];
  node.innerHTML = `
    <span>${escapeHtml(tr("followUpTitle"))}</span>
    <div>
      ${items
        .map(([labelKey, promptKey]) => `<button type="button" class="followup-chip" data-followup="${escapeHtml(promptKey)}">${escapeHtml(tr(labelKey))}</button>`)
        .join("")}
    </div>
  `;
  log.appendChild(node);
  node.querySelectorAll("[data-followup]").forEach((button) => {
    button.addEventListener("click", () => {
      $("#chatQuestion").value = button.dataset.followup === "followUpSources" ? tr("followUpSources") : tr(button.dataset.followup);
      $("#chatQuestion").focus();
    });
  });
  log.scrollTop = log.scrollHeight;
}

function addMessage(role, text, options = {}) {
  const log = $("#chatLog");
  const empty = log.querySelector(".chat-empty");
  if (empty) empty.remove();
  const node = document.createElement("div");
  node.className = `message ${role}`;
  const body = role === "assistant" ? markdownToHtml(text) : `<p>${escapeHtml(text)}</p>`;
  node.innerHTML = `
    <div class="message-avatar">${role === "user" ? icon("user") : icon("spark")}</div>
    <div class="message-body">
      <span>${role === "user" ? "You" : "AI"}</span>
      <div class="message-content${role === "assistant" ? " markdown-body" : ""}">${body}</div>
    </div>
  `;
  log.appendChild(node);
  log.scrollTop = log.scrollHeight;
  return node;
}

function cap(value) {
  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

function titleCase(value) {
  return String(value)
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function initSummaryGrid() {
  const grid = $("#summaryGrid");
  if (!grid) return;
  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".summary-card--clickable");
    if (!card) return;
    const action = card.dataset.action;
    if (action === "lagna") {
      setActiveTab("chart");
    } else if (action === "moon") {
      setActiveTab("chart");
      setTimeout(() => openPlanetInterpretationModal({ planet_key: "moon", division: "D1" }), 60);
    } else if (action === "dashas") {
      setActiveTab("dashas");
    } else if (action === "sources") {
      setActiveTab("report");
      setTimeout(() => {
        const link = document.querySelector('.report-nav-link[href="#rsec-sources"]');
        if (link) link.click();
      }, 80);
    }
  });
}

function initTabs() {
  $$(".tab").forEach((button) => {
    button.addEventListener("click", () => {
      setActiveTab(button.dataset.tab);
    });
  });
}

function setActiveTab(tab) {
  $$(".tab").forEach((item) => item.classList.toggle("active", item.dataset.tab === tab));
  $$(".tab-view").forEach((item) => item.classList.remove("active"));
  const view = $(`#tab-${tab}`);
  if (view) view.classList.add("active");

  if (tab === "geo") {
    // Small delay so the tab panel is visible before Leaflet initializes
    setTimeout(() => {
      initGeoMap();
      if (_geoState.map) _geoState.map.invalidateSize();
      if (state.currentRunId && !_geoState.lineObjects.length) {
        renderGeo(state.currentRunId);
      }
    }, 60);
  }

  if (tab === "forecast") {
    if (!state.currentRunId) {
      _fcSetVisible("norun");
    } else if (!_fcState.data || _fcState.data._runId !== state.currentRunId) {
      loadForecast(_fcState.date || _fcTodayStr());
    } else {
      _fcSetVisible("content");
    }
  }

  if (tab === "dashas" && state.chart) {
    const mahadashas = state.chart.dashas?.mahadashas || [];
    const antardasha_map = {};
    (state.chart.dashas?.antardashas || []).forEach((a) => {
      if (!antardasha_map[a.mahadasha]) antardasha_map[a.mahadasha] = [];
      antardasha_map[a.mahadasha].push(a);
    });
    const now = new Date();
    const currentIdx = mahadashas.findIndex((m) => now >= new Date(m.start) && now <= new Date(m.end));
    if (currentIdx !== -1) {
      setTimeout(() => openDashaModal(mahadashas, antardasha_map, currentIdx), 120);
    }
  }
}

function initReportNav() {
  const nav = $("#reportNav");
  if (!nav) return;

  nav.addEventListener("click", (e) => {
    const link = e.target.closest(".report-nav-link");
    if (!link) return;
    e.preventDefault();
    const targetId = link.getAttribute("href").slice(1);
    const target = $(`#${targetId}`);
    if (!target) return;
    $$(".report-nav-link", nav).forEach((l) => l.classList.remove("active"));
    link.classList.add("active");
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  const body = $(".unified-report-body");
  if (!body) return;

  const sections = $$(".report-section", body);
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          $$(".report-nav-link", nav).forEach((l) => {
            l.classList.toggle("active", l.getAttribute("href") === `#${id}`);
          });
        }
      });
    },
    { root: body, threshold: 0.3 }
  );
  sections.forEach((s) => observer.observe(s));
}

function initLanguage() {
  $$("[data-lang]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextLang = button.dataset.lang;
      if (!t[nextLang]) return;
      state.lang = nextLang;
      saveLanguage(state.lang);
      applyI18n();
      if (state.chart) {
        renderSummary({
          lagna: `${state.chart.lagna?.sign || ""} ${state.chart.lagna?.degree_formatted || ""}`.trim(),
          moon: state.chart.planets?.moon
            ? `${state.chart.planets.moon.sign}, ${state.chart.planets.moon.nakshatra} pada ${state.chart.planets.moon.pada}, house ${state.chart.planets.moon.house}`
            : "missing",
          current_period: Object.values(state.chart.dashas?.current || {}).filter(Boolean).join(" / "),
          sources_found: state.context?.items?.length || 0,
          sources_missing: state.context?.missing?.length || 0,
        });
        if (state.context) {
          renderOverview(state.chart, state.context);
          renderTables(state.chart);
          renderDashas(state.chart);
          renderSources(state.context);
        }
        // Re-render forecast with new language if already loaded
        if (_fcState.data) {
          _fcState.data._runId = null; // force re-fetch with new lang
          loadForecast(_fcState.date || _fcTodayStr());
        }
      }
    });
  });
}

// ── Forecast tab ────────────────────────────────────────────────────────────

const _fcState = {
  date: null,
  data: null,
};

function _fcTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function _fcShiftDate(dateStr, days) {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`;
}

function _fcScoreClass(score) {
  if (score >= 60) return "good";
  if (score >= 35) return "mid";
  return "bad";
}

function _fcBavClass(bav) {
  if (bav >= 5) return "good";
  if (bav >= 3) return "mid";
  return "bad";
}

function _fcSetVisible(which) {
  const map = { loading:"fcLoading", error:"fcError", norun:"fcNoRun", content:"fcContent" };
  Object.entries(map).forEach(([k, id]) => {
    const el = $(`#${id}`);
    if (el) el.classList.toggle("hidden", k !== which);
  });
}

async function loadForecast(dateStr) {
  if (!state.currentRunId) { _fcSetVisible("norun"); return; }
  _fcState.date = dateStr;
  const inp = $("#fcDateInput");
  if (inp) inp.value = dateStr;
  _fcSetVisible("loading");
  try {
    const data = await api(`/api/forecast/${state.currentRunId}?date=${dateStr}&lang=${state.lang}`);
    data._runId = state.currentRunId;
    _fcState.data = data;
    renderForecast(data);
  } catch (err) {
    _fcSetVisible("error");
    console.error("Forecast error:", err);
  }
}

function renderForecast(data) {
  _renderFcScore(data.score || 0);
  _renderFcMoon(data.lunar_phase, data.transit_planets || []);
  _renderFcTips(data.tips || []);
  _renderFcDasha(data.active_dasha || {});
  _renderFcAvarga(data.transit_avarga || []);
  _renderFcTransits(data.transit_planets || [], data.transit_avarga || []);
  _fcSetVisible("content");
}

function _renderFcScore(score) {
  const cls = _fcScoreClass(score);
  const ringFill = $("#fcRingFill");
  if (ringFill) {
    ringFill.style.strokeDashoffset = 427.3 * (1 - score / 100);
    ringFill.setAttribute("class", `fc-ring-fill ${cls}`);
  }
  const numEl = $("#fcScoreNum");
  if (numEl) numEl.textContent = Math.round(score);
  const lblEl = $("#fcScoreLabel");
  if (lblEl) {
    lblEl.textContent = tr(cls === "good" ? "forecastScoreGood" : cls === "bad" ? "forecastScoreBad" : "forecastScoreMid");
    lblEl.className = `fc-score-label fc-score-label--${cls}`;
  }
  const meta = $("#fcScoreMeta");
  if (meta) {
    const scoreStr = `${Math.round(score)}/100`;
    const isRu = state.lang === "ru";
    meta.innerHTML = `<span class="fc-score-date">${_fcState.date || ""}</span>` +
      `<span class="fc-score-badge fc-score-badge--${cls}">${escapeHtml(scoreStr)}</span>`;
  }
}

function _renderFcMoon(phase, transitPlanets) {
  const el = $("#fcMoon");
  if (!el) return;
  if (!phase) { el.innerHTML = ""; return; }

  const moonTp = transitPlanets.find(t => t.planet === "moon");
  const tithi = phase.tithi;
  const illum = phase.illumination_pct;
  const isRu = state.lang === "ru";
  const phaseName = isRu ? phase.phase_name_ru : phase.phase_name_en;
  const paksha = phase.paksha === "shukla" ? (isRu ? "Шукла" : "Shukla") : (isRu ? "Кришна" : "Krishna");

  // Moon emoji by phase
  const moonEmoji = tithi <= 2 ? "🌑" : tithi <= 7 ? "🌒" : tithi <= 10 ? "🌓"
    : tithi <= 14 ? "🌔" : tithi === 15 ? "🌕" : tithi <= 20 ? "🌖"
    : tithi <= 24 ? "🌗" : tithi <= 28 ? "🌘" : "🌑";

  // Illumination arc (simple CSS variable approach)
  const arcPct = Math.round(illum);

  const nkText = moonTp ? `${moonTp.nakshatra} ${moonTp.pada}` : "";
  const houseText = moonTp ? `${isRu ? "дом" : "H"}${moonTp.house}` : "";

  el.innerHTML =
    `<div class="fc-moon-row">` +
      `<span class="fc-moon-emoji">${moonEmoji}</span>` +
      `<div class="fc-moon-info">` +
        `<div class="fc-moon-top">` +
          `<span class="fc-moon-phase">${phaseName}</span>` +
          `<span class="fc-moon-tithi">${isRu ? "Титхи" : "Tithi"} ${tithi} · ${paksha}</span>` +
        `</div>` +
        `<div class="fc-moon-bottom">` +
          `<div class="fc-moon-illum-track"><div class="fc-moon-illum-fill" style="width:${arcPct}%"></div></div>` +
          `<span class="fc-moon-illum-val">${illum}%</span>` +
          (nkText ? `<span class="fc-moon-nk">${nkText} · ${houseText}</span>` : "") +
        `</div>` +
      `</div>` +
    `</div>`;
}

function _renderFcTips(tips) {
  const el = $("#fcTips");
  if (!el) return;
  if (!tips.length) {
    el.innerHTML = `<div class="fc-tip info"><span class="fc-tip-icon">ℹ</span><span class="fc-tip-text">—</span></div>`;
    return;
  }
  el.innerHTML = tips.map(tip => {
    const type = tip.type || "info";
    const ico = tip.icon || "ℹ";
    const text = state.lang === "ru" ? (tip.text_ru || tip.text || "") : (tip.text_en || tip.text || "");
    return `<div class="fc-tip ${escapeHtml(type)}">` +
      `<span class="fc-tip-icon">${escapeHtml(ico)}</span>` +
      `<span class="fc-tip-text">${escapeHtml(text)}</span>` +
      `</div>`;
  }).join("");
}

function _renderFcDasha(dasha) {
  const el = $("#fcDasha");
  if (!el) return;
  const maha = dasha.mahadasha || "—";
  const antar = dasha.antardasha || "—";
  const pratya = dasha.pratyantardasha || null;
  const days = dasha.antardasha_remaining_days;
  const mahaColor = PLANET_META[maha.toLowerCase()]?.color || "var(--gold)";
  const antarColor = PLANET_META[antar.toLowerCase()]?.color || "var(--violet)";
  const pratyaColor = pratya ? (PLANET_META[pratya.toLowerCase()]?.color || "var(--text-dim)") : null;
  let html = `<div class="fc-dasha-pill main" style="--pill-color:${mahaColor}">` +
    `${escapeHtml(maha)}</div>` +
    `<span class="fc-dasha-sep">/</span>` +
    `<div class="fc-dasha-pill" style="--pill-color:${antarColor}">` +
    `${escapeHtml(antar)}</div>`;
  if (pratya) {
    html += `<span class="fc-dasha-sep">/</span>` +
      `<div class="fc-dasha-pill" style="--pill-color:${pratyaColor}">` +
      `${escapeHtml(pratya)}</div>`;
  }
  if (days != null) {
    html += `<span class="fc-dasha-remaining">${days}d</span>`;
  }
  el.innerHTML = html;
}

function _renderFcAvarga(transitAvarga) {
  const el = $("#fcAvarga");
  if (!el) return;
  const order = ["sun","moon","mars","mercury","jupiter","venus","saturn"];
  const ruLabels = {sun:"☉",moon:"☽",mars:"♂",mercury:"☿",jupiter:"♃",venus:"♀",saturn:"♄"};
  const rows = order.map(p => {
    const av = transitAvarga.find(x => x.planet === p);
    if (!av || av.bav == null) return "";
    const score = av.bav;
    const pct = Math.round((score / 8) * 100);
    const cls = _fcBavClass(score);
    const pm = PLANET_META[p] || { color: "var(--muted)" };
    return `<div class="fc-avarga-row">` +
      `<span class="fc-avarga-glyph" style="color:${pm.color}">${ruLabels[p] || p}</span>` +
      `<div class="fc-bav-track"><div class="fc-bav-fill ${cls}" style="width:${pct}%"></div></div>` +
      `<span class="fc-bav-val ${cls}">${score}</span>` +
      `</div>`;
  }).filter(Boolean);
  el.innerHTML = rows.join("") || "—";
}

function _renderFcTransits(transits, transitAvarga) {
  const el = $("#fcTransits");
  if (!el) return;
  if (!transits.length) { el.innerHTML = "—"; return; }
  const isRu = state.lang === "ru";

  const ruNames = {sun:"Солнце",moon:"Луна",mars:"Марс",mercury:"Меркурий",
                   jupiter:"Юпитер",venus:"Венера",saturn:"Сатурн",rahu:"Раху",ketu:"Кету"};

  // Human-readable house meanings
  const houseMeaningRu = {
    1:"сфера себя и тела", 2:"деньги и речь", 3:"решимость и коммуникации",
    4:"дом и душевный покой", 5:"творчество и дети", 6:"здоровье и работа",
    7:"отношения и партнёры", 8:"трансформации и скрытое", 9:"удача и мировоззрение",
    10:"карьера и статус", 11:"доходы и окружение", 12:"уединение и потери"
  };
  const houseMeaningEn = {
    1:"identity & body", 2:"wealth & speech", 3:"courage & communication",
    4:"home & peace of mind", 5:"creativity & children", 6:"health & work",
    7:"relationships & partners", 8:"transformation & hidden", 9:"luck & worldview",
    10:"career & status", 11:"income & network", 12:"solitude & loss"
  };

  // Planet themes (short)
  const planetThemeRu = {
    sun:"воля и авторитет", moon:"эмоции и привычки", mars:"энергия и действие",
    mercury:"мышление и общение", jupiter:"рост и мудрость", venus:"любовь и удовольствия",
    saturn:"дисциплина и ограничения", rahu:"амбиции и перемены", ketu:"духовность и отпускание"
  };
  const planetThemeEn = {
    sun:"willpower & authority", moon:"emotions & habits", mars:"energy & action",
    mercury:"thinking & communication", jupiter:"growth & wisdom", venus:"love & pleasures",
    saturn:"discipline & limits", rahu:"ambition & disruption", ketu:"spirituality & release"
  };

  const dignityTextRu = {exalted:"в силе", own_sign:"в своём знаке", debilitated:"ослаблен"};
  const dignityTextEn = {exalted:"strong", own_sign:"at home", debilitated:"weakened"};
  const dignityClassMap = {exalted:"good", own_sign:"mid", debilitated:"bad", neutral:""};

  const rows = transits.map(t => {
    const pm = PLANET_META[t.planet] || { glyph: "○", color: "var(--text)", label: t.planet };
    const pName = isRu ? (ruNames[t.planet] || t.planet) : (pm.label || t.planet);
    const house = t.house || "";
    const houseMeaning = isRu ? (houseMeaningRu[house] || "") : (houseMeaningEn[house] || "");
    const theme = isRu ? (planetThemeRu[t.planet] || "") : (planetThemeEn[t.planet] || "");
    const dig = t.dignity || "neutral";
    const digText = isRu ? (dignityTextRu[dig] || "") : (dignityTextEn[dig] || "");
    const digCls = dignityClassMap[dig] || "";
    const retro = t.retrograde;

    // Compose the "story" line
    let story = "";
    if (isRu) {
      story = `${theme}`;
      if (houseMeaning) story += ` — в сфере: ${houseMeaning}`;
      if (retro) story += `. Ретроградный: пересмотр и внутренняя работа`;
      if (dig === "exalted") story += `. Усилен`;
      if (dig === "debilitated") story += `. Ослаблен — требует внимания`;
    } else {
      story = `${theme}`;
      if (houseMeaning) story += ` — in the area of: ${houseMeaning}`;
      if (retro) story += `. Retrograde: review and inner work`;
      if (dig === "exalted") story += `. Strengthened`;
      if (dig === "debilitated") story += `. Weakened — needs attention`;
    }

    const digBadge = digText
      ? `<span class="fc-tr-dig fc-tr-dig--${digCls}">${escapeHtml(digText)}</span>`
      : "";
    const retroBadge = retro ? `<span class="fc-retro-tag">℞</span>` : "";

    const av = (transitAvarga || []).find(x => x.planet === t.planet);
    const bavScore = av && av.bav != null ? av.bav : null;
    const bavBadge = bavScore !== null
      ? `<span class="fc-tr-bav fc-tr-bav--${_fcBavClass(bavScore)}" title="${isRu ? "Аштакаварга" : "Ashtakavarga"} BAV">${bavScore}/8</span>`
      : "";

    return `<div class="fc-tr-card">` +
      `<div class="fc-tr-row1">` +
        `<span class="fc-tr-glyph" style="color:${pm.color}">${pm.glyph}</span>` +
        `<span class="fc-tr-name">${escapeHtml(pName)}${retroBadge}</span>` +
        bavBadge +
      `</div>` +
      `<div class="fc-tr-row2">` +
        `<span class="fc-tr-loc">${escapeHtml(t.sign || "")} · ${isRu ? "дом" : "H"}${house}</span>` +
        digBadge +
      `</div>` +
      `<div class="fc-tr-theme">${escapeHtml(theme)}</div>` +
      `</div>`;
  });

  el.innerHTML = rows.join("");
}

function _renderFcSources(context) {
  const el = $("#fcSources");
  if (!el) return;
  const items = context.items || [];
  if (!items.length) { el.innerHTML = `<span class="fc-hint">—</span>`; return; }
  el.innerHTML = items.slice(0, 10).map(item =>
    `<div class="fc-src-row">` +
    `<div class="fc-src-key">${escapeHtml(item.key || "")}</div>` +
    `<div>${escapeHtml(itemText(item))}</div>` +
    `</div>`
  ).join("");
}

function initForecast() {
  _fcState.date = _fcTodayStr();
  const inp = $("#fcDateInput");
  if (inp) inp.value = _fcState.date;

  $("#fcPrevDay")?.addEventListener("click", () =>
    loadForecast(_fcShiftDate(_fcState.date || _fcTodayStr(), -1)));
  $("#fcNextDay")?.addEventListener("click", () =>
    loadForecast(_fcShiftDate(_fcState.date || _fcTodayStr(), 1)));
  $("#fcToday")?.addEventListener("click", () => loadForecast(_fcTodayStr()));
  $("#fcDateInput")?.addEventListener("change", (e) => {
    if (e.target.value) loadForecast(e.target.value);
  });
  $("#fcAskAI")?.addEventListener("click", () => {
    setActiveTab("ai");
    const d = _fcState.data;
    if (!d) return;
    const dateStr = _fcState.date || _fcTodayStr();
    const isRu = state.lang === "ru";

    const score = d.score ?? "?";
    const dasha = d.active_dasha || {};
    const maha = dasha.mahadasha || "?";
    const antar = dasha.antardasha || "?";
    const pratya = dasha.pratyantardasha || null;
    const dashaStr = pratya ? `${maha}/${antar}/${pratya}` : `${maha}/${antar}`;

    // Moon / lunar phase
    const lp = d.lunar_phase;
    const moonTp = (d.transit_planets || []).find(t => t.planet === "moon");
    const moonLine = lp
      ? (isRu
        ? `Луна: ${lp.phase_name_ru}, титхи ${lp.tithi} (${lp.paksha === "shukla" ? "Шукла" : "Кришна"}), освещённость ${lp.illumination_pct}%${moonTp ? `, накшатра ${moonTp.nakshatra} пада ${moonTp.pada}, дом ${moonTp.house}` : ""}`
        : `Moon: ${lp.phase_name_en}, tithi ${lp.tithi} (${lp.paksha}), illumination ${lp.illumination_pct}%${moonTp ? `, nakshatra ${moonTp.nakshatra} pada ${moonTp.pada}, house ${moonTp.house}` : ""}`)
      : "";

    // Transits summary
    const ruNames = {sun:"Солнце",moon:"Луна",mars:"Марс",mercury:"Меркурий",
                     jupiter:"Юпитер",venus:"Венера",saturn:"Сатурн",rahu:"Раху",ketu:"Кету"};
    const transitLines = (d.transit_planets || []).map(t => {
      const name = isRu ? (ruNames[t.planet] || t.planet) : t.planet.charAt(0).toUpperCase() + t.planet.slice(1);
      const retro = t.retrograde ? (isRu ? " ℞" : " Rx") : "";
      const dig = t.dignity !== "neutral" ? ` (${t.dignity})` : "";
      return isRu
        ? `${name}${retro}: ${t.sign}, дом ${t.house}${dig}`
        : `${name}${retro}: ${t.sign}, house ${t.house}${dig}`;
    });

    // BAV highlights
    const bavLines = (d.transit_avarga || [])
      .filter(av => av.bav != null && (av.bav >= 6 || av.bav <= 2))
      .map(av => {
        const name = isRu ? (ruNames[av.planet] || av.planet) : av.planet;
        return isRu
          ? `${name}: BAV ${av.bav}/8 ${av.bav >= 6 ? "(сильный транзит)" : "(слабый транзит)"}`
          : `${name}: BAV ${av.bav}/8 ${av.bav >= 6 ? "(strong transit)" : "(weak transit)"}`;
      });

    // Tips texts
    const tipTexts = (d.tips || []).map(t =>
      isRu ? (t.text_ru || "") : (t.text_en || "")
    ).filter(Boolean);

    let prompt;
    if (isRu) {
      prompt = `Прогноз на ${dateStr}:\n`
        + `• Оценка дня: ${score}/100\n`
        + `• Даша: ${dashaStr}\n`
        + (moonLine ? `• ${moonLine}\n` : "")
        + (transitLines.length ? `• Транзиты:\n  ${transitLines.join("\n  ")}\n` : "")
        + (bavLines.length ? `• Аштакаварга: ${bavLines.join(", ")}\n` : "")
        + (tipTexts.length ? `• Акценты дня: ${tipTexts.join("; ")}\n` : "")
        + `\nПроанализируй этот день с точки зрения джйотиша. Что стоит учесть, на что обратить внимание?`;
    } else {
      prompt = `Forecast for ${dateStr}:\n`
        + `• Day score: ${score}/100\n`
        + `• Dasha: ${dashaStr}\n`
        + (moonLine ? `• ${moonLine}\n` : "")
        + (transitLines.length ? `• Transits:\n  ${transitLines.join("\n  ")}\n` : "")
        + (bavLines.length ? `• Ashtakavarga: ${bavLines.join(", ")}\n` : "")
        + (tipTexts.length ? `• Day highlights: ${tipTexts.join("; ")}\n` : "")
        + `\nAnalyze this day from a Jyotish perspective. What should I keep in mind?`;
    }

    const chatInp = $("#chatQuestion");
    if (chatInp) { chatInp.value = prompt; chatInp.focus(); }
  });
}

function boot() {
  const savedLanguage = getSavedLanguage();
  if (savedLanguage) state.lang = savedLanguage;
  applyI18n();
  initLanguage();
  initTabs();
  initReportNav();
  initSummaryGrid();
  initPlanetModal();
  initDashaModal();
  initSettingsModal();
  initChartViewToggle();
  initForecast();
  initGeoSearch();
  initGeoAI();
  $("#birthForm").addEventListener("submit", generateReport);
  $("#refreshProfiles").addEventListener("click", loadProfiles);
  $("#newProfileBtn").addEventListener("click", newProfile);
  $("#placeQuery").addEventListener("input", debounce(searchPlaces, 180));
  $("#chatForm").addEventListener("submit", askQuestion);
  $("#clearChatBtn").addEventListener("click", clearChat);
  $$(".prompt-chip").forEach((button) => {
    button.addEventListener("click", () => {
      $("#chatQuestion").value = tr(`${button.dataset.promptKey}Text`);
      $("#chatQuestion").focus();
    });
  });
  loadProfiles().then(() => updateProfileModeBadge()).catch((error) => setStatus(error.message, "error"));
  checkFirstRun();
}

async function checkFirstRun() {
  try {
    const data = await api("/api/settings");
    if (data.needs_setup) openSettingsModal(true);
  } catch { /* ignore — server may be warming up */ }
}

// ── Astrocartography / Geo tab ──────────────────────────────────────────────

const _geoState = {
  map: null,
  layers: {},          // planet_key → L.layerGroup
  lineObjects: [],     // {line, allPolylines[], midLatLng}
  paranObjects: [],    // {paran, marker, glowMarker}
  filterActive: new Set(),
  initialized: false,
  _hoverTimer: null,
};

function _geoScoreColor(score) {
  if (score >= 7) return "#4ade80";
  if (score >= 4) return "#86efac";
  if (score >= 1) return "#d9f99d";
  if (score === 0) return "#94a3b8";
  if (score >= -3) return "#fca5a5";
  if (score >= -6) return "#f87171";
  return "#ef4444";
}

function initGeoMap() {
  if (_geoState.map) return;
  const container = document.getElementById("geoMap");
  if (!container || typeof L === "undefined") return;

  const map = L.map("geoMap", {
    center: [20, 0],
    zoom: 2,
    minZoom: 1,
    maxZoom: 19,
    worldCopyJump: true,
    zoomControl: true,
  });

  // Dark base tiles with labels
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: "© CartoDB",
    subdomains: "abcd",
    maxZoom: 19,
    maxNativeZoom: 19,
    pane: "tilePane",
  }).addTo(map);

  _geoState.map = map;
  _geoState.initialized = true;
}

function initGeoSearch() {
  const input = $("#geoSearchInput");
  const results = $("#geoSearchResults");
  if (!input || !results) return;

  let _searchTimer = null;

  input.addEventListener("input", () => {
    clearTimeout(_searchTimer);
    const q = input.value.trim();
    if (q.length < 2) { results.classList.add("hidden"); return; }
    _searchTimer = setTimeout(() => _geoSearch(q, input, results), 300);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { results.classList.add("hidden"); input.blur(); }
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest("#geoSearchWrap")) results.classList.add("hidden");
  });
}

async function _geoSearch(q, input, results) {
  const lang = state.lang === "ru" ? "ru" : "en";
  try {
    const data = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&accept-language=${lang}`
    ).then(r => r.json());

    if (!data.length) { results.classList.add("hidden"); return; }

    results.innerHTML = data.map((item, i) =>
      `<div class="geo-search-result-item" data-lat="${item.lat}" data-lon="${item.lon}" data-idx="${i}">
        ${escapeHtml(item.display_name.split(",").slice(0, 3).join(", "))}
      </div>`
    ).join("");
    results.classList.remove("hidden");

    results.querySelectorAll(".geo-search-result-item").forEach(el => {
      el.addEventListener("click", () => {
        const lat = parseFloat(el.dataset.lat);
        const lon = parseFloat(el.dataset.lon);
        const map = _geoState.map;
        if (map) map.flyTo([lat, lon], 8, { duration: 1.2 });
        input.value = el.textContent.trim();
        results.classList.add("hidden");
      });
    });
  } catch {
    results.classList.add("hidden");
  }
}

function initGeoAI() {
  const btn = $("#geoAskAIBtn");
  const hint = $("#geoAIHint");
  const cancelBtn = $("#geoAICancelBtn");
  if (!btn || !hint || !cancelBtn) return;

  let pickMode = false;

  function enterPickMode() {
    pickMode = true;
    btn.classList.add("active");
    hint.style.display = "flex";
    const mapEl = document.getElementById("geoMap");
    if (mapEl) mapEl.classList.add("pick-mode");
  }

  function exitPickMode() {
    pickMode = false;
    btn.classList.remove("active");
    hint.style.display = "none";
    const mapEl = document.getElementById("geoMap");
    if (mapEl) mapEl.classList.remove("pick-mode");
  }

  btn.addEventListener("click", () => {
    if (pickMode) exitPickMode();
    else enterPickMode();
  });

  cancelBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    exitPickMode();
  });

  document.getElementById("geoMap")?.addEventListener("click", (e) => {
    if (!pickMode) return;
    const map = _geoState.map;
    if (!map) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const point = L.point(e.clientX - rect.left, e.clientY - rect.top);
    const latlng = map.containerPointToLatLng(point);
    exitPickMode();
    _geoAskAIAtPoint(latlng.lat, latlng.lng);
  });
}

function _geoAskAIAtPoint(lat, lng) {
  const isRu = state.lang === "ru";

  // Reverse geocode via Nominatim
  fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat.toFixed(4)}&lon=${lng.toFixed(4)}&format=json&accept-language=${isRu ? "ru" : "en"}`)
    .then(r => r.json())
    .catch(() => null)
    .then(geo => {
      const locName = geo?.display_name
        ? geo.display_name.split(",").slice(0, 3).join(",").trim()
        : `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
      _buildGeoAIPrompt(lat, lng, locName, isRu);
    });
}

function _buildGeoAIPrompt(lat, lng, locName, isRu) {
  // Find nearest ACG lines (within ~15 degrees)
  const THRESHOLD_DEG = 15;
  const nearLines = [];

  for (const obj of _geoState.lineObjects) {
    const { line, allPolylines } = obj;
    let minDist = Infinity;
    for (const pl of allPolylines) {
      const lls = pl.getLatLngs ? pl.getLatLngs() : [];
      for (const pt of lls) {
        const d = Math.abs(pt.lng - lng);
        const wrap = Math.min(d, 360 - d);
        const dist = Math.sqrt(wrap * wrap + (pt.lat - lat) * (pt.lat - lat));
        if (dist < minDist) minDist = dist;
      }
    }
    if (minDist <= THRESHOLD_DEG) {
      nearLines.push({ line, dist: minDist });
    }
  }

  nearLines.sort((a, b) => a.dist - b.dist);
  const top = nearLines.slice(0, 5);

  const ruNames = { sun:"Солнце",moon:"Луна",mars:"Марс",mercury:"Меркурий",
                    jupiter:"Юпитер",venus:"Венера",saturn:"Сатурн",rahu:"Раху",ketu:"Кету" };
  const angleRu = { AC:"АС",IC:"IC",DC:"ДС",MC:"MC" };

  const linesDesc = top.map(({ line }) => {
    const planet = isRu ? (ruNames[line.planet] || line.planet) : (line.planet.charAt(0).toUpperCase() + line.planet.slice(1));
    const angle  = isRu ? (angleRu[line.angle] || line.angle) : line.angle;
    const score  = `${line.score > 0 ? "+" : ""}${line.score}`;
    const label  = line.label || "";
    return isRu
      ? `${planet} ${angle} (${label}, ${score})`
      : `${planet} ${angle} (${label}, ${score})`;
  });

  const chart = state.chart;
  const birth = chart?.birth || {};
  const lagna = chart?.lagna?.sign || "?";
  const dasha = state.context?.current_dasha;
  const dashaStr = dasha
    ? (dasha.pratyantardasha
        ? `${dasha.mahadasha}/${dasha.antardasha}/${dasha.pratyantardasha}`
        : `${dasha.mahadasha}/${dasha.antardasha}`)
    : "?";

  let prompt;
  if (isRu) {
    prompt = `Локация: ${locName} (${lat.toFixed(2)}, ${lng.toFixed(2)})\n`
      + (lagna !== "?" ? `Лагна: ${lagna}\n` : "")
      + (dashaStr !== "?" ? `Текущая даша: ${dashaStr}\n` : "")
      + (linesDesc.length
          ? `Ближайшие линии астрокартографии:\n${linesDesc.map(l => `  • ${l}`).join("\n")}\n`
          : "Линии ACG рядом не обнаружены.\n")
      + `\nЧто значит эта локация для меня с точки зрения ведической астрологии и астрокартографии? Какие темы, возможности и испытания она активирует?`;
  } else {
    prompt = `Location: ${locName} (${lat.toFixed(2)}, ${lng.toFixed(2)})\n`
      + (lagna !== "?" ? `Lagna: ${lagna}\n` : "")
      + (dashaStr !== "?" ? `Current dasha: ${dashaStr}\n` : "")
      + (linesDesc.length
          ? `Nearest astrocartography lines:\n${linesDesc.map(l => `  • ${l}`).join("\n")}\n`
          : "No nearby ACG lines found.\n")
      + `\nWhat does this location mean for me from a Vedic astrology and astrocartography perspective? What themes, opportunities, and challenges does it activate?`;
  }

  setActiveTab("ai");
  const chatInp = $("#chatQuestion");
  if (chatInp) { chatInp.value = prompt; chatInp.focus(); }
}

async function renderGeo(runId) {
  if (!runId) {
    const el = document.getElementById("geoLegend");
    if (el) el.innerHTML = `<p class="geo-empty">${tr("geoNoRun")}</p>`;
    return;
  }

  const loading = document.getElementById("geoLoading");
  if (loading) loading.classList.remove("hidden");

  try {
    const data = await api(`/api/geo/${runId}`);
    _drawGeoLines(data);
  } catch (err) {
    const legend = document.getElementById("geoLegend");
    if (legend) legend.innerHTML = `<p class="geo-empty geo-error">${tr("geoError")}: ${escapeHtml(err.message)}</p>`;
  } finally {
    if (loading) loading.classList.add("hidden");
  }
}

function _drawGeoLines(data) {
  initGeoMap();
  const map = _geoState.map;
  if (!map) return;

  // Clear old layers
  Object.values(_geoState.layers).forEach((lg) => map.removeLayer(lg));
  _geoState.layers = {};
  _geoState.lineObjects = [];
  _geoState.paranObjects = [];
  _geoState.filterActive.clear();

  const lines = data.lines || [];
  const parans = data.parans || [];

  // Group lines by planet
  const planetLines = {};
  for (const line of lines) {
    if (!planetLines[line.planet]) planetLines[line.planet] = [];
    planetLines[line.planet].push(line);
  }

  const PLANET_ORDER_GEO = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu"];

  for (const pk of PLANET_ORDER_GEO) {
    if (!planetLines[pk]) continue;
    _geoState.filterActive.add(pk);
    const layerGroup = L.layerGroup().addTo(map);
    _geoState.layers[pk] = layerGroup;

    for (const line of planetLines[pk]) {
      const color = _geoScoreColor(line.score);
      const absScore = Math.abs(line.score);
      const lineWeight = absScore >= 6 ? 2.5 : absScore >= 3 ? 2 : 1.5;
      const zoneDeg = 4 + absScore * 0.5;
      const tooltipText = `${line.glyph || ""} ${line.label}  ${line.score > 0 ? "+" : ""}${line.score}`;
      const allPolylines = [];
      let midLatLng = null;

      for (const seg of (line.coords || [])) {
        if (seg.length < 2) continue;
        // Unwrap longitudes so consecutive points stay close (no cross-screen jumps)
        const latlngs = [];
        let prevLon = seg[0][0];
        for (const [lon, lat] of seg) {
          let d = lon - prevLon;
          if (d > 180) d -= 360;
          else if (d < -180) d += 360;
          prevLon = prevLon + d;
          latlngs.push([lat, prevLon]);
        }
        if (latlngs.length < 2) continue;

        // Geographic zone polygon
        const leftEdge = latlngs.map(([lat, lon]) => [lat, lon - zoneDeg]);
        const rightEdge = latlngs.map(([lat, lon]) => [lat, lon + zoneDeg]);
        L.polygon([...leftEdge, ...[...rightEdge].reverse()], {
          color, weight: 0, fillColor: color, fillOpacity: 0.07,
          interactive: false, smoothFactor: 1,
        }).addTo(layerGroup);

        // Halo
        L.polyline(latlngs, {
          color, weight: lineWeight + 5, opacity: 0.18,
          interactive: false, smoothFactor: 0.5,
        }).addTo(layerGroup);

        // Main line
        const pl = L.polyline(latlngs, {
          color, weight: lineWeight, opacity: 0.95,
          dashArray: line.dash ? "8 5" : null, smoothFactor: 0.5,
        }).addTo(layerGroup);
        pl.bindTooltip(tooltipText, { sticky: true, className: "geo-tooltip" });
        allPolylines.push(pl);

        // Label
        const mid = latlngs[Math.floor(latlngs.length / 2)];
        if (!midLatLng) midLatLng = mid;
        const scoreStr = `${line.score > 0 ? "+" : ""}${line.score}`;
        L.marker(mid, {
          icon: L.divIcon({
            className: "geo-line-label",
            html: `<span style="color:${color}">${line.glyph || ""}<b>${line.angle}</b> <small>${scoreStr}</small></span>`,
            iconAnchor: [0, 8],
          }),
          interactive: false,
        }).addTo(layerGroup);
      }

      _geoState.lineObjects.push({ line, pk, allPolylines, midLatLng });
    }
  }

  // Paran markers — drawn above lines, below labels layer
  const paranLayer = L.layerGroup().addTo(map);
  _geoState.layers["__parans"] = paranLayer;

  for (const p of parans.slice(0, 25)) {
    const color = _geoScoreColor(p.score);
    const absScore = Math.abs(p.score);
    const r = Math.max(5, absScore * 1.1);
    const latlng = [p.latitude, p.longitude];

    const glowMarker = L.circleMarker(latlng, {
      radius: r + 7, color, fillColor: color,
      fillOpacity: 0.08, weight: 0, interactive: false,
    }).addTo(paranLayer);

    const marker = L.circleMarker(latlng, {
      radius: r, color, fillColor: color, fillOpacity: 0.35, weight: 1.5,
    })
      .addTo(paranLayer)
      .bindTooltip(
        `${p.glyph_a || ""}${p.angle_a} × ${p.glyph_b || ""}${p.angle_b}  ${p.score > 0 ? "+" : ""}${p.score}`,
        { sticky: true, className: "geo-tooltip" }
      );

    _geoState.paranObjects.push({ p, marker, glowMarker, color, r });
  }

  _buildGeoSidebar(planetLines, PLANET_ORDER_GEO, parans, lines);
}

function _buildGeoSidebar(planetLines, order, parans, lines) {
  _buildGeoPlanetList(planetLines, order);
  _buildParansList(parans);
  _buildCityRankings(lines || []);
}

function _geoHighlightLine(pk, angle, highlight) {
  for (const obj of _geoState.lineObjects) {
    const match = angle ? (obj.pk === pk && obj.line.angle === angle) : obj.pk === pk;
    for (const pl of obj.allPolylines) {
      if (match && highlight) {
        pl.setStyle({ weight: pl.options.weight * 2.2, opacity: 1 });
        pl.bringToFront();
      } else {
        pl.setStyle({ weight: pl.options._origWeight ?? pl.options.weight, opacity: pl.options._origOpacity ?? 0.95 });
      }
    }
  }
}

function _geoFlyToLine(pk, angle) {
  const map = _geoState.map;
  if (!map) return;
  const objects = _geoState.lineObjects.filter(
    o => o.pk === pk && (!angle || o.line.angle === angle) && o.allPolylines.length
  );
  if (!objects.length) return;
  try {
    let bounds = null;
    for (const obj of objects) {
      for (const pl of obj.allPolylines) {
        const b = pl.getBounds();
        bounds = bounds ? bounds.extend(b) : b;
      }
    }
    if (bounds && bounds.isValid()) {
      map.flyToBounds(bounds, { padding: [60, 60], maxZoom: 4, duration: 0.7 });
    }
  } catch (e) { /* ignore */ }
}

function _buildGeoPlanetList(planetLines, order) {
  const el = document.getElementById("geoLegend");
  if (!el) return;

  const ANGLE_DESC_SHORT = {
    ru: { ASC: "Асц — личность", MC: "МС — карьера", DSC: "Дес — отношения", IC: "НС — дом" },
    en: { ASC: "ASC — identity", MC: "MC — career", DSC: "DSC — relations", IC: "IC — home" },
  };
  const lang = state.lang === "en" ? "en" : "ru";
  const adesc = ANGLE_DESC_SHORT[lang];

  const rows = order
    .filter((pk) => planetLines[pk])
    .map((pk) => {
      const meta = PLANET_META[pk] || { glyph: "?", color: "#888", label: pk };
      const lines = planetLines[pk] || [];
      const angleTags = lines.map((l) => {
        const sc = l.score;
        const col = _geoScoreColor(sc);
        const sign = sc > 0 ? `+${sc}` : `${sc}`;
        const tip = `${adesc[l.angle] || l.angle}: ${sign}`;
        return `<span class="geo-angle-chip" data-planet="${pk}" data-angle="${l.angle}" style="--chip-color:${col}" title="${escapeHtml(tip)}">${l.angle}<sub>${sign}</sub></span>`;
      }).join("");

      return `<div class="geo-planet-row" data-planet="${pk}" style="--planet-color:${meta.color}">
        <span class="geo-planet-glyph">${meta.glyph}</span>
        <span class="geo-planet-name">${meta.label}</span>
        <span class="geo-planet-angles">${angleTags}</span>
      </div>`;
    })
    .join("");

  el.innerHTML = rows;

  el.addEventListener("click", (e) => {
    const chip = e.target.closest(".geo-angle-chip");
    if (chip) {
      _geoFlyToLine(chip.dataset.planet, chip.dataset.angle);
      return;
    }
    const row = e.target.closest(".geo-planet-row");
    if (!row) return;
    const pk = row.dataset.planet;
    const lg = _geoState.layers[pk];
    if (!lg) return;
    if (_geoState.filterActive.has(pk)) {
      _geoState.map?.removeLayer(lg);
      _geoState.filterActive.delete(pk);
      row.classList.add("geo-planet-row--hidden");
    } else {
      _geoState.map?.addLayer(lg);
      _geoState.filterActive.add(pk);
      row.classList.remove("geo-planet-row--hidden");
    }
  });
}

function _buildParansList(parans) {
  const el = document.getElementById("geoParansList");
  if (!el) return;

  const top = parans.slice(0, 12);
  if (!top.length) { el.innerHTML = ""; return; }

  el.innerHTML = top.map((p, idx) => {
    const color = _geoScoreColor(p.score);
    const sign = p.score > 0 ? "+" : "";
    const metaA = PLANET_META[p.planet_a] || { glyph: "?", color: "#888", label: p.planet_a };
    const metaB = PLANET_META[p.planet_b] || { glyph: "?", color: "#888", label: p.planet_b };
    const lat = `${p.latitude > 0 ? "N" : "S"}${Math.abs(p.latitude).toFixed(0)}°`;
    return `<div class="geo-paran-row" data-paran-idx="${idx}">
      <span class="geo-paran-score" style="color:${color}">${sign}${p.score}</span>
      <span class="geo-paran-body">
        <span class="geo-paran-pair">
          <span style="color:${metaA.color}">${metaA.glyph}</span>${metaA.label} ${p.angle_a}
          <span class="geo-paran-x">×</span>
          <span style="color:${metaB.color}">${metaB.glyph}</span>${metaB.label} ${p.angle_b}
        </span>
        <span class="geo-paran-lat">${lat}</span>
      </span>
    </div>`;
  }).join("");
}

// ── City scoring ────────────────────────────────────────────────────────────

const GEO_CITIES = [
  // Europe
  { name: "London", lat: 51.5, lon: -0.1 },
  { name: "Paris", lat: 48.9, lon: 2.3 },
  { name: "Berlin", lat: 52.5, lon: 13.4 },
  { name: "Rome", lat: 41.9, lon: 12.5 },
  { name: "Madrid", lat: 40.4, lon: -3.7 },
  { name: "Barcelona", lat: 41.4, lon: 2.2 },
  { name: "Amsterdam", lat: 52.4, lon: 4.9 },
  { name: "Vienna", lat: 48.2, lon: 16.4 },
  { name: "Zurich", lat: 47.4, lon: 8.5 },
  { name: "Prague", lat: 50.1, lon: 14.4 },
  { name: "Warsaw", lat: 52.2, lon: 21.0 },
  { name: "Stockholm", lat: 59.3, lon: 18.1 },
  { name: "Oslo", lat: 59.9, lon: 10.8 },
  { name: "Copenhagen", lat: 55.7, lon: 12.6 },
  { name: "Helsinki", lat: 60.2, lon: 25.0 },
  { name: "Lisbon", lat: 38.7, lon: -9.1 },
  { name: "Athens", lat: 37.9, lon: 23.7 },
  { name: "Budapest", lat: 47.5, lon: 19.0 },
  { name: "Bucharest", lat: 44.4, lon: 26.1 },
  { name: "Belgrade", lat: 44.8, lon: 20.5 },
  { name: "Kyiv", lat: 50.5, lon: 30.5 },
  { name: "Minsk", lat: 53.9, lon: 27.6 },
  { name: "Vilnius", lat: 54.7, lon: 25.3 },
  { name: "Riga", lat: 56.9, lon: 24.1 },
  { name: "Tallinn", lat: 59.4, lon: 24.7 },
  { name: "Brussels", lat: 50.8, lon: 4.4 },
  { name: "Bern", lat: 46.9, lon: 7.4 },
  { name: "Milan", lat: 45.5, lon: 9.2 },
  { name: "Munich", lat: 48.1, lon: 11.6 },
  { name: "Hamburg", lat: 53.6, lon: 10.0 },
  // Russia / CIS
  { name: "Moscow", lat: 55.8, lon: 37.6 },
  { name: "St Petersburg", lat: 59.9, lon: 30.3 },
  { name: "Novosibirsk", lat: 55.0, lon: 82.9 },
  { name: "Yekaterinburg", lat: 56.8, lon: 60.6 },
  { name: "Kazan", lat: 55.8, lon: 49.1 },
  { name: "Nizhny Novgorod", lat: 56.3, lon: 44.0 },
  { name: "Chelyabinsk", lat: 55.2, lon: 61.4 },
  { name: "Omsk", lat: 55.0, lon: 73.4 },
  { name: "Samara", lat: 53.2, lon: 50.2 },
  { name: "Ufa", lat: 54.7, lon: 55.9 },
  { name: "Rostov-on-Don", lat: 47.2, lon: 39.7 },
  { name: "Krasnodar", lat: 45.0, lon: 38.9 },
  { name: "Vladivostok", lat: 43.1, lon: 131.9 },
  { name: "Irkutsk", lat: 52.3, lon: 104.3 },
  { name: "Tbilisi", lat: 41.7, lon: 44.8 },
  { name: "Almaty", lat: 43.3, lon: 76.9 },
  { name: "Tashkent", lat: 41.3, lon: 69.3 },
  { name: "Baku", lat: 40.4, lon: 49.9 },
  { name: "Yerevan", lat: 40.2, lon: 44.5 },
  { name: "Bishkek", lat: 42.9, lon: 74.6 },
  // Middle East
  { name: "Istanbul", lat: 41.0, lon: 28.9 },
  { name: "Ankara", lat: 39.9, lon: 32.9 },
  { name: "Dubai", lat: 25.2, lon: 55.3 },
  { name: "Abu Dhabi", lat: 24.5, lon: 54.4 },
  { name: "Riyadh", lat: 24.7, lon: 46.7 },
  { name: "Tel Aviv", lat: 32.1, lon: 34.8 },
  { name: "Jerusalem", lat: 31.8, lon: 35.2 },
  { name: "Beirut", lat: 33.9, lon: 35.5 },
  { name: "Amman", lat: 31.9, lon: 35.9 },
  { name: "Tehran", lat: 35.7, lon: 51.4 },
  { name: "Baghdad", lat: 33.3, lon: 44.4 },
  { name: "Cairo", lat: 30.1, lon: 31.2 },
  // Asia
  { name: "Mumbai", lat: 19.1, lon: 72.9 },
  { name: "Delhi", lat: 28.6, lon: 77.2 },
  { name: "Bangalore", lat: 12.9, lon: 77.6 },
  { name: "Chennai", lat: 13.1, lon: 80.3 },
  { name: "Kolkata", lat: 22.6, lon: 88.4 },
  { name: "Hyderabad", lat: 17.4, lon: 78.5 },
  { name: "Pune", lat: 18.5, lon: 73.9 },
  { name: "Ahmedabad", lat: 23.0, lon: 72.6 },
  { name: "Jaipur", lat: 26.9, lon: 75.8 },
  { name: "Beijing", lat: 39.9, lon: 116.4 },
  { name: "Shanghai", lat: 31.2, lon: 121.5 },
  { name: "Shenzhen", lat: 22.5, lon: 114.1 },
  { name: "Guangzhou", lat: 23.1, lon: 113.3 },
  { name: "Chengdu", lat: 30.6, lon: 104.1 },
  { name: "Wuhan", lat: 30.6, lon: 114.3 },
  { name: "Hong Kong", lat: 22.3, lon: 114.2 },
  { name: "Taipei", lat: 25.0, lon: 121.5 },
  { name: "Seoul", lat: 37.6, lon: 127.0 },
  { name: "Tokyo", lat: 35.7, lon: 139.7 },
  { name: "Osaka", lat: 34.7, lon: 135.5 },
  { name: "Singapore", lat: 1.3, lon: 103.8 },
  { name: "Bangkok", lat: 13.8, lon: 100.5 },
  { name: "Kuala Lumpur", lat: 3.1, lon: 101.7 },
  { name: "Jakarta", lat: -6.2, lon: 106.8 },
  { name: "Manila", lat: 14.6, lon: 121.0 },
  { name: "Ho Chi Minh City", lat: 10.8, lon: 106.7 },
  { name: "Hanoi", lat: 21.0, lon: 105.8 },
  { name: "Yangon", lat: 16.9, lon: 96.2 },
  { name: "Colombo", lat: 6.9, lon: 79.9 },
  { name: "Karachi", lat: 24.9, lon: 67.1 },
  { name: "Lahore", lat: 31.5, lon: 74.3 },
  { name: "Dhaka", lat: 23.7, lon: 90.4 },
  { name: "Kathmandu", lat: 27.7, lon: 85.3 },
  // Africa
  { name: "Lagos", lat: 6.5, lon: 3.4 },
  { name: "Nairobi", lat: -1.3, lon: 36.8 },
  { name: "Addis Ababa", lat: 9.0, lon: 38.7 },
  { name: "Casablanca", lat: 33.6, lon: -7.6 },
  { name: "Tunis", lat: 36.8, lon: 10.2 },
  { name: "Accra", lat: 5.6, lon: -0.2 },
  { name: "Dar es Salaam", lat: -6.8, lon: 39.3 },
  { name: "Johannesburg", lat: -26.2, lon: 28.0 },
  { name: "Cape Town", lat: -33.9, lon: 18.4 },
  { name: "Kinshasa", lat: -4.3, lon: 15.3 },
  // Americas
  { name: "New York", lat: 40.7, lon: -74.0 },
  { name: "Los Angeles", lat: 34.1, lon: -118.2 },
  { name: "Chicago", lat: 41.9, lon: -87.6 },
  { name: "Houston", lat: 29.8, lon: -95.4 },
  { name: "Phoenix", lat: 33.4, lon: -112.1 },
  { name: "Philadelphia", lat: 40.0, lon: -75.2 },
  { name: "San Antonio", lat: 29.4, lon: -98.5 },
  { name: "San Diego", lat: 32.7, lon: -117.2 },
  { name: "Dallas", lat: 32.8, lon: -96.8 },
  { name: "San Francisco", lat: 37.8, lon: -122.4 },
  { name: "Seattle", lat: 47.6, lon: -122.3 },
  { name: "Denver", lat: 39.7, lon: -104.9 },
  { name: "Boston", lat: 42.4, lon: -71.1 },
  { name: "Miami", lat: 25.8, lon: -80.2 },
  { name: "Atlanta", lat: 33.7, lon: -84.4 },
  { name: "Toronto", lat: 43.7, lon: -79.4 },
  { name: "Vancouver", lat: 49.3, lon: -123.1 },
  { name: "Montreal", lat: 45.5, lon: -73.6 },
  { name: "Mexico City", lat: 19.4, lon: -99.1 },
  { name: "Guadalajara", lat: 20.7, lon: -103.3 },
  { name: "Bogota", lat: 4.7, lon: -74.1 },
  { name: "Lima", lat: -12.1, lon: -77.0 },
  { name: "Santiago", lat: -33.5, lon: -70.6 },
  { name: "Buenos Aires", lat: -34.6, lon: -58.4 },
  { name: "São Paulo", lat: -23.5, lon: -46.6 },
  { name: "Rio de Janeiro", lat: -22.9, lon: -43.2 },
  { name: "Caracas", lat: 10.5, lon: -66.9 },
  { name: "Havana", lat: 23.1, lon: -82.4 },
  // Oceania
  { name: "Sydney", lat: -33.9, lon: 151.2 },
  { name: "Melbourne", lat: -37.8, lon: 145.0 },
  { name: "Brisbane", lat: -27.5, lon: 153.0 },
  { name: "Perth", lat: -31.9, lon: 115.9 },
  { name: "Auckland", lat: -36.9, lon: 174.8 },
];

function _scoreCityFromLines(cityLat, cityLon, lines) {
  // For each ACG line, find the closest point on the line to this city.
  // If within RADIUS degrees, add the line's score weighted by proximity.
  const RADIUS = 5.0; // degrees longitude (~500km at equator)
  let total = 0;
  const influences = [];

  for (const line of lines) {
    let minDist = Infinity;
    for (const seg of (line.coords || [])) {
      for (const [lon, lat] of seg) {
        // Use lat-weighted longitude distance
        const dLat = Math.abs(lat - cityLat);
        if (dLat > 15) continue; // skip far latitudes
        const dLon = Math.abs(lon - cityLon);
        const dLonWrapped = Math.min(dLon, 360 - dLon);
        const dist = Math.sqrt(dLonWrapped * dLonWrapped + dLat * dLat);
        if (dist < minDist) minDist = dist;
      }
    }
    if (minDist < RADIUS) {
      // Weight: full at 0, zero at RADIUS
      const weight = Math.max(0, 1 - minDist / RADIUS);
      total += line.score * weight;
      if (Math.abs(line.score) >= 3) {
        influences.push({ label: `${line.glyph || ""}${line.angle}`, score: line.score, weight });
      }
    }
  }

  // Sort influences by abs impact
  influences.sort((a, b) => Math.abs(b.score * b.weight) - Math.abs(a.score * a.weight));
  return { total: Math.round(total * 10) / 10, influences: influences.slice(0, 3) };
}

function _buildCityRankings(lines) {
  const el = document.getElementById("geoCityRankings");
  if (!el) return;

  const scored = GEO_CITIES.map((city) => {
    const { total, influences } = _scoreCityFromLines(city.lat, city.lon, lines);
    return { ...city, total, influences };
  }).filter(c => c.total !== 0);

  scored.sort((a, b) => b.total - a.total);

  const best = scored.slice(0, 10);
  const worst = scored.slice(-10).reverse();

  const renderCity = (c, rank) => {
    const col = _geoScoreColor(c.total);
    const sign = c.total > 0 ? "+" : "";
    const inf = c.influences.map(i => {
      const sc = i.score > 0 ? `+${i.score}` : `${i.score}`;
      return `<span class="geo-city-inf" style="color:${_geoScoreColor(i.score)}">${i.label}${sc}</span>`;
    }).join("");
    return `<div class="geo-city-row" data-lat="${c.lat}" data-lon="${c.lon}">
      <span class="geo-city-rank">${rank}</span>
      <span class="geo-city-body">
        <span class="geo-city-name">${escapeHtml(c.name)}</span>
        <span class="geo-city-influences">${inf}</span>
      </span>
      <span class="geo-city-score" style="color:${col}">${sign}${c.total}</span>
    </div>`;
  };

  el.innerHTML = `
    <div class="geo-cities-group">
      <div class="geo-cities-head geo-cities-head--good">▲ ${state.lang === "ru" ? "Лучшие города" : "Best cities"}</div>
      ${best.map((c, i) => renderCity(c, i + 1)).join("")}
    </div>
    <div class="geo-cities-group">
      <div class="geo-cities-head geo-cities-head--bad">▼ ${state.lang === "ru" ? "Сложные города" : "Challenging cities"}</div>
      ${worst.map((c, i) => renderCity(c, i + 1)).join("")}
    </div>`;

  // Click — fly to city
  el.addEventListener("click", (e) => {
    const row = e.target.closest(".geo-city-row");
    if (!row) return;
    const lat = parseFloat(row.dataset.lat);
    const lon = parseFloat(row.dataset.lon);
    _geoState.map?.flyTo([lat, lon], 5, { duration: 0.8 });
  });
}

function debounce(fn, delay) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function getSavedActiveProfileId() {
  try {
    return localStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveActiveProfileId(profileId) {
  if (!profileId) return;
  try {
    localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, profileId);
  } catch {
    // Ignore storage failures and keep app functional.
  }
}

function clearSavedActiveProfileId() {
  try {
    localStorage.removeItem(ACTIVE_PROFILE_STORAGE_KEY);
  } catch {
    // Ignore storage failures and keep app functional.
  }
}

function getSavedLanguage() {
  try {
    const stored = localStorage.getItem(ACTIVE_LANGUAGE_STORAGE_KEY);
    return t[stored] ? stored : null;
  } catch {
    return null;
  }
}

function saveLanguage(lang) {
  if (!t[lang]) return;
  try {
    localStorage.setItem(ACTIVE_LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // Ignore storage failures and keep app functional.
  }
}

boot();


