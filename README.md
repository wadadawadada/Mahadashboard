# Mahadashboard

A local Vedic astrology (Jyotish) workstation. Enter a birth date, time, and place — get a precise chart, dasha timeline, daily forecast, curated interpretations, and an AI assistant. Everything runs on your machine; no cloud subscription required.

![Language](https://img.shields.io/badge/language-EN%20%7C%20RU-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![Python](https://img.shields.io/badge/python-%3E%3D3.10-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

---

## What's inside

- **Accurate chart calculation** — Swiss Ephemeris via pyswisseph; Lahiri ayanamsa, sidereal zodiac, whole-sign houses, Vimshottari dasha from Moon
- **Multiple chart layers** — D1 Rashi (2D & 3D), D9 Navamsa, planet table, house table, aspect table
- **Life Path** — full Vimshottari dasha timeline with interactive period cards
- **Daily Forecast** — transit score for any date, active dasha, Moon phase, Ashtakavarga (BAV), planet-of-the-day tips; navigate day by day or jump to any date
- **Curated source library** — 3 000+ interpretation snippets for planets, signs, houses, nakshatras, dashas
- **AI chat** — ask questions about the chart in English or Russian; powered by OpenRouter (bring your own key)
- **Astrocartography (Geo)** — planet lines and parans overlaid on a world map
- **Multiple profiles** — save and switch between birth charts
- **Export** — download a single Markdown file ready to paste into any AI assistant
- **Bilingual UI** — full English and Russian interface

---

## Before you start — install two tools

You need **Node.js** and **Python** installed on your computer. Both are free.

### 1. Install Node.js

Go to **[nodejs.org/en/download](https://nodejs.org/en/download/)** and download the installer for your system (choose the **LTS** version). Run it and click through — default options are fine.

> To check it worked, open a terminal and type `node --version`. You should see something like `v20.x.x`.

### 2. Install Python

Go to **[python.org/downloads](https://www.python.org/downloads/)** and download the latest installer.

**Windows users:** on the first screen of the installer, check the box **"Add Python to PATH"** before clicking Install. This is important.

> To check it worked, open a terminal and type `python --version`. You should see `Python 3.x.x`.

---

## Installation

Open a terminal in the folder where you want to keep the project, then run:

```bash
git clone https://github.com/wadadawadada/Mahadashboard.git
cd Mahadashboard
npm install
```

`npm install` will automatically install both Node.js and Python dependencies. You should see a line like `Python dependencies installed successfully.` at the end.

---

## Running

```bash
npm start
```

The app opens at **http://localhost:7860** automatically in your browser.

---

## First-time setup — AI chat (optional)

The AI chat tab requires a free API key from OpenRouter. Chart calculations work without it.

1. Get a free key at **[openrouter.ai/keys](https://openrouter.ai/keys)**
2. Click the ⚙ gear icon in the top-left of the app
3. Paste your key and choose a model (e.g. `openai/gpt-4o-mini` — free on OpenRouter)

---

## How to use

1. **Enter birth data** — name, date, time, and place in the left panel
2. **Click "Generate report"** — the engine calculates the chart and saves the profile
3. **Explore the tabs:**
   - **Chart** — D1 Rashi wheel (switch 2D / 3D), D9 Navamsa; click any planet for interpretations
   - **Life Path** — Vimshottari dasha timeline; click a period for a detailed card
   - **Forecast** — daily transit score, active dasha, Moon, Ashtakavarga (BAV 0–8), planet-of-the-day tips; use the arrows to navigate between days or pick any date
   - **Geo** — astrocartography map with planet lines and city rankings
   - **Report** — overview, curated sources, tables, and Markdown export
   - **AI** — chat with an LLM about the calculated chart
4. **Switch language** — EN / RU toggle in the top-left corner
5. **Manage profiles** — click any saved profile in the left panel; use `+` to start a new chart

---

## Troubleshooting

**`npm install` says Python was not found**
→ Make sure Python is installed and "Add Python to PATH" was checked during installation. Close and reopen your terminal, then try again.

**`npm start` says Python dependencies are not installed**
→ Run `npm install` again.

**`pyswisseph` install fails on Windows**
→ Make sure pip is up to date (`python -m pip install --upgrade pip`). If it still fails, install [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/).

**Blank chart after generation**
→ Open the browser console (F12). If you see a 500 error, check the terminal for the Python traceback.

**AI chat returns nothing**
→ Confirm your OpenRouter API key is set and has credits. You can update the key any time via the ⚙ gear icon.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla JS, CSS custom properties |
| 3D chart | [Three.js](https://threejs.org/) |
| Map | [Leaflet](https://leafletjs.com/) |
| Server | Node.js (built-in `http`, no framework) |
| Ephemeris | [pyswisseph](https://github.com/astrorigin/pyswisseph) (Swiss Ephemeris) |
| AI | [OpenRouter](https://openrouter.ai/) |

---

## License

MIT — see [LICENSE](LICENSE).
