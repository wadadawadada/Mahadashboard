# Product Brief — Code-Quality Remediation

Source: overall code-quality analysis, 2026-06-27 (4 parallel review passes + direct verification + green `pytest` run).

## Goal
Resolve the findings from the code-quality analysis without regressing the working app
(43 green pytest, functioning SPA). Priority order: **security → data integrity →
correctness → maintainability → tests/tooling.**

## Findings inventory (by severity)

### Critical
- **C1** API key disclosed: `GET /api/settings` returns full `openrouter_api_key` unauthenticated (`server.js:834-836`; `app.js:1962`).
- **C2** Concurrent `profiles.json` read-modify-write clobbers data (`server.js:404-469`).
- **C3** Shared scratch files (`data/input/birth.json`, `data/reports/latest.*`) race → cross-user chart mixups (`server.js:501-529`).

### High
- **H1** Server binds all interfaces, no auth (`server.js:1539` — no host arg).
- **H2** No timeout/kill on spawned Python or OpenRouter `fetch` → hangs + zombies (`server.js:561-578, 240-250, 801`).
- **H3** Unbounded subprocess fan-out → DoS; `/forecast/{id}/month` spawns ~31 procs/request (`server.js:1044-1069`).
- **H4** No process-level crash handlers; double-send risk when error thrown post-headers (`server.js:1518-1524`).
- **H5** Path traversal via unvalidated `lang` param (`server.js:987, 1028`).
- **H6** First-mahadasha antardasha sub-period math wrong (`dashas.py:85-104`) — masked by weak test.
- **H7** Mangal Dosha mitigation never fires — checks `"own"` but engine emits `"own_sign"` (`compatibility.py:453`); `test_compatibility.py:43` masks it.

### Medium
- **M1** "Dhanishta" vs "Dhanishtha" spelling split silently drops Moon-in-Dhanishta scoring (`transits.py:112,1165,1342`).
- **M2** No input validation in `schemas.py`; `"HH:MM:SS"` crashes `timezone.py:9`.
- **M3** Unguarded `places.json` load → uncaught traceback (`location.py:12`, `cli.py:48-52`).
- **M4** `server.js` monolith: ~280-line `route()`, ~300-line `buildExportMarkdown`.
- **M5** `transits.py` (1,380 LOC) god-module — split into panchanga/scoring/tips/indicators/i18n.
- **M6** `app.js` 8,365-line non-modular global script (285 functions, several 230–257-line render fns).
- **M7** Missing files return 500 not 404; bad percent-encoding → 500 not 400 (`server.js:580-588, 827`).
- **M8** First `/api/celebrities` parses 3.5MB CSV char-by-char on the event loop (`server.js:299-380`).
- **M9** Static assets buffered + re-read every request, `no-store` even for vendor bundles (`server.js:1111-1186`).
- **M10** Raw Python stderr / `error.detail` reflected to clients (`server.js:575,1521`).
- **M11** No security headers / CSP; `startsWith` boundary missing `path.sep` (`server.js:1138,1165`).

### Low / quick wins
- **L1** `public/app.js.bak_mojibake_fix` (46KB) tracked in git → `git rm` + gitignore `*.bak*`.
- **L2** Dead code: `renderOverviewLegacy`, `renderTablesLegacy` (~250 lines).
- **L3** Leaflet from unpkg with no SRI (`index.html:734`).
- **L4** `<html lang="ru">` hardcoded while app toggles EN/RU.
- **L5** `requirements.txt` all `>=` unpinned; no `pip-audit`/`ruff` in CI; `.venv` shipped without deps.
- **L6** Untested: `transits`, `astrocartography`, `ashtakavarga`, `dignity`, `houses`, `ephemeris`, `timezone`.

## Verified-safe (do not regress)
Subprocess args are injection-proof (array args, JSON-file input); AI-chat XSS mitigated
(escape-before-format, `javascript:` blocked); 2MB body cap; UUID-validated ids; no
hardcoded secrets; no mojibake remaining; `chart3d.mjs` is exemplary.
