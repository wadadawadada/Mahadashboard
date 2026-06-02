# Mahadashboard

A local-first Vedic astrology (Jyotish) workstation. Enter a birth date, time, and place — get a precise chart, dasha timeline, curated interpretations, and an AI assistant that answers questions about the chart. Everything runs on your machine; no cloud subscription required.

![Language](https://img.shields.io/badge/language-EN%20%7C%20RU-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![Python](https://img.shields.io/badge/python-%3E%3D3.10-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Features

- **Accurate chart calculation** — Swiss Ephemeris via `pyswisseph`; Lahiri ayanamsa, sidereal zodiac, whole-sign houses, Vimshottari dasha from Moon
- **Multiple chart layers** — D1 Rashi (2D & 3D), D9 Navamsa, planet table, house table, aspect table
- **Dasha timeline (Life Path)** — full Vimshottari sequence with interactive period cards
- **Curated source library** — 3 000+ interpretation snippets for planets, signs, houses, nakshatras, dashas
- **AI chat** — ask questions about the chart in English or Russian; powered by OpenRouter (bring your own key)
- **Astrocartography (Geo)** — planet lines and parans overlaid on a world map
- **Multiple profiles** — save and switch between birth charts
- **Export** — download a single Markdown file ready to paste into any AI assistant
- **Bilingual UI** — full English and Russian interface

---

## Requirements

| Dependency | Version |
|---|---|
| Node.js | ≥ 18 |
| Python | ≥ 3.10 |
| pip | any recent |

> The AI chat feature requires a free [OpenRouter](https://openrouter.ai/keys) API key. All chart calculations work without it.

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/mahadashboard.git
cd mahadashboard
```

### 2. Install Node dependencies

```bash
npm install
```

### 3. Install Python dependencies

```bash
pip install -r requirements.txt
```

> On some systems you may need `pip3` instead of `pip`, or use a virtual environment:
> ```bash
> python -m venv .venv
> source .venv/bin/activate   # Windows: .venv\Scripts\activate
> pip install -r requirements.txt
> ```

### 4. Configure environment

Copy the example env file and edit it:

```bash
cp .env.example .env
```

Open `.env` and fill in the values:

```env
PORT=7860
PYTHON_BIN=python          # or python3, or full path e.g. /usr/bin/python3

# Optional — required only for the AI chat tab
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=openai/gpt-4o-mini
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_SITE_URL=http://localhost:7860
OPENROUTER_APP_NAME=Mahadashboard

OPEN_BROWSER=true          # set to false to disable auto-open
```

Get a free OpenRouter key at [openrouter.ai/keys](https://openrouter.ai/keys). Any model listed on [openrouter.ai/models](https://openrouter.ai/models) works — copy its ID (e.g. `openai/gpt-4o-mini`).

---

## Running

```bash
npm start
```

The server starts on `http://localhost:7860` and opens the browser automatically (set `OPEN_BROWSER=false` to disable).

---

## Usage

1. **Enter birth data** — name, date (DD.MM.YYYY), time, and place in the left panel
2. **Click "Generate report"** — the Python engine calculates the chart and saves the profile
3. **Explore the tabs:**
   - **Chart** — D1 Rashi wheel (switch 2D / 3D), D9 Navamsa grid; click any planet to see its interpretations
   - **Life Path** — Vimshottari dasha timeline; click a period for a detailed card
   - **Report** — Overview, curated Sources, planet/house/aspect Tables, and Export
   - **AI** — chat with an LLM about the calculated chart
   - **Geo** — astrocartography map with planet lines and city rankings
4. **Switch language** — EN / RU toggle in the top-left corner
5. **Manage profiles** — click any saved profile in the left panel to load it; use the `+` button to start a new chart

---

## Project Structure

```
mahadashboard/
├── server.js               # Node.js HTTP server & API
├── public/
│   ├── index.html          # Single-page application shell
│   ├── app.js              # All frontend logic & i18n
│   ├── chart3d.mjs         # Three.js 3D chart renderer
│   └── styles.css
├── jyotish/                # Python calculation engine
│   ├── cli.py              # CLI entry point (report, geo commands)
│   ├── engine/             # Calculator, ephemeris, dashas, aspects …
│   └── knowledge/          # Interpretation retrieval
├── data/
│   ├── knowledge/
│   │   └── interpretations.jsonl   # 3 000+ bilingual source snippets
│   ├── service/
│   │   ├── profiles.json           # Saved birth profiles
│   │   └── runs/                   # Per-run chart + context files
│   └── reports/            # Latest run outputs (chart, context, report)
├── requirements.txt
├── package.json
└── .env                    # Local configuration (not committed)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla JS, CSS custom properties |
| 3D chart | [Three.js](https://threejs.org/) |
| Map | [Leaflet](https://leafletjs.com/) |
| Server | Node.js (built-in `http`, no framework) |
| Ephemeris | [pyswisseph](https://github.com/astrorigin/pyswisseph) (Swiss Ephemeris) |
| AI | [OpenRouter](https://openrouter.ai/) |

---

## Troubleshooting

**`Could not start Python report engine`**
→ Make sure `PYTHON_BIN` in `.env` points to the correct Python 3.10+ executable. Try `python3` or the full path.

**Blank chart after generation**
→ Check the browser console. If you see a 500 error, run `npm start` and look at the terminal output for the Python traceback.

**`pyswisseph` install fails on Windows**
→ Install the Microsoft C++ Build Tools first: [visualstudio.microsoft.com/visual-cpp-build-tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)

**AI chat returns nothing**
→ Confirm your `OPENROUTER_API_KEY` is set and has credits. You can set or update the key inside the app via the ⚙ settings button.

---

## Contributing

Pull requests are welcome. For significant changes, please open an issue first to discuss what you would like to change.

---

## License

MIT — see [LICENSE](LICENSE).
