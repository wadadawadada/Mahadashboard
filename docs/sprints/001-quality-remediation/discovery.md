---
project: Mahadashboard (jyotish-service)
sprint: sprint-001
created: 2026-06-27
new_repo: false
input_quality: structured-brief
has_ux_artifacts: false
has_frontend: true
previous_sprint: null
---

## Project Overview
Mahadashboard is a self-hosted Vedic-astrology web app. A deterministic Python engine
(`jyotish/`, Swiss Ephemeris) computes charts, dashas, transits, compatibility and
astrocartography; a dependency-light Node HTTP server (`server.js`) wraps the Python CLI
as a subprocess, serves a vanilla-JS single-page frontend (`public/`), and proxies an
optional AI chat tab to OpenRouter.

## Input Analysis
Input is a structured code-quality analysis produced by four parallel review passes
(Python engine, Node backend, frontend, security) on 2026-06-27, cross-verified against
direct greps and a green test run. It is finding-level and traceable — closer to a
`structured-brief` than a raw idea: every requirement maps to a concrete finding with a
`file:line`. The brief is captured in `product-brief.md`.

## New Repo Detection
Existing codebase. 81 git-tracked files; build manifests present (`package.json`,
`pyproject.toml`, `requirements.txt`); source dirs `jyotish/`, `public/`, `scripts/`, `tests/`.

## Existing Codebase Inventory
### Tech Stack
- **Backend:** Node ≥18, CommonJS, **stdlib-only** (sole prod dep: `three@0.184.0`). ~1,580 LOC in one `server.js`.
- **Engine:** Python ≥3.10 — `pyswisseph`, `pydantic` v2, `typer`, `python-dateutil`, `pytz`, `timezonefinder`, `geopy`, `jinja2`. ~5,100 LOC across `jyotish/`.
- **Frontend:** vanilla JS, **no framework / no bundler** — `public/app.js` (8,365 LOC, classic `<script>`), `public/chart3d.mjs` (three.js ES module), `index.html`, `styles.css` (9,062 LOC). Leaflet loaded from unpkg CDN.
- **Tests:** `pytest` (43 tests, green); `node --check` + `tests/web-static.check.mjs` for JS (no runtime JS tests).

### Project Structure
- `jyotish/` — engine (`engine/*.py`), `cli.py`, `schemas.py`, `reports/`, `knowledge/`.
- `server.js` — monolithic HTTP server (routing + Python spawn + OpenRouter proxy + markdown export + static serving).
- `public/` — SPA (`app.js`, `chart3d.mjs`, `index.html`, `styles.css`) + a stray `app.js.bak_mojibake_fix`.
- `scripts/` — interpretation-text generators + Node pre/postinstall helpers + large `.jsonl` data.
- `data/` — celebrities (3.5MB CSV), knowledge, places; user runs/reports are gitignored.
- `tests/` — pytest engine tests + one static web check.

### Existing Patterns
- **API style:** ad-hoc REST over Node `http`; a ~280-line `route()` if-chain. JSON bodies capped at 2MB. `ApiError(status, msg, detail)` contract.
- **Subprocess pattern:** `spawn(PYTHON_BIN, [argsArray], {cwd})` — array args, never `shell:true`; birth data passed as a JSON file via `--input` (injection-safe, verified).
- **Persistence:** flat JSON files (`profiles.json`, `places.json`) read-modify-written in place; per-run dirs under `data/reports/<uuid>/`.
- **Auth:** none. `server.listen(port, cb)` with no host → binds all interfaces.
- **Frontend:** single global `state` object (mutated ~210×), `escapeHtml()` discipline (260 calls), no `eval`/`var`/loose `==`.
- **i18n:** bilingual RU/EN throughout, toggled at runtime.

### Module Boundaries
`engine.calculation` · `engine.dashas` · `engine.transits` · `engine.compatibility` ·
`engine.astrocartography` · `server.routing` · `server.python-bridge` · `server.openrouter-proxy` ·
`server.markdown-export` · `server.static` · `frontend.render` · `frontend.chart3d` · `frontend.chat`.

## Available Artifacts
- `product-brief.md` — the code-quality analysis distilled (this sprint's source).
- No prior sprint-plan artifacts (first sprint).

## UX Status
No UX artifacts found. **Not applicable to this sprint** — it is a remediation sprint
(security, correctness, refactor); no new UI surface is introduced. Phase 1.5 (UX design)
is therefore skipped. `document.documentElement.lang` is a small a11y fix tracked as an FR.

## Recommendations
- Input is finding-level and traceable → Phase 1 requirements derive directly from the four reviews; no persona/metric invention needed.
- **Scope risk (for Phase 1B):** the brief mixes must-fix security/correctness (small, high-value) with large refactors (`transits.py` split, `app.js` ES-module migration, `server.js` decomposition). These must be separated into IN / STRETCH / DEFER or the sprint will balloon.
- Engine has a green 43-test baseline but the two biggest modules (`transits.py`, `astrocartography.py`) are untested and two correctness bugs are currently *masked* by existing tests — regression tests are a first-class deliverable, not optional.
- Skip Phase 1.5 (UX) — no new UI.
