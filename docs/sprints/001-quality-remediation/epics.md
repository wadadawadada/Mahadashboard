---
sprint: sprint-001
created: 2026-06-27
epics_count: 8
stories_total: 22
stories_in: 19
stories_stretch: 3
enrichment: skipped (default mode — stories are stubs with BDD criteria)
---

# Epics & Stories — Quality Remediation

Test tiers: `smoke` (happy-path assertion), `thorough` (edge + regression), `yolo` (manual/visual).
Each story is independently shippable. `node --check` + `pytest` must stay green after every story.

---

## E1 — Lock down the deployment surface  *(FR1, FR2, FR3, FR10)*
Highest severity, lowest effort. Do first.

### S1.1 — Bind to loopback by default *(FR1, ADR-001)* · tier: smoke
Add `HOST` env (default `127.0.0.1`) and pass it to `server.listen`.
- **Given** no `HOST` set, **when** the server starts, **then** it listens on `127.0.0.1` and a LAN peer cannot connect.
- **Given** `HOST=0.0.0.0`, **when** set explicitly, **then** it binds all interfaces (opt-in).
- Files: `server.js:1539`. Deps: none.

### S1.2 — Stop disclosing the API key *(FR2, ADR-002)* · tier: thorough
`GET /api/settings` returns `{ has_key, model, base_url, needs_setup }`; client stops reading the key.
- **Given** a configured key, **when** `GET /api/settings`, **then** the response contains no `openrouter_api_key` and `has_key=true`.
- **Given** the settings UI loads, **then** the key input shows a masked placeholder, not the secret; saving a new key still works (POST unchanged).
- Files: `server.js:75-94,834-836`, `public/app.js:1957-1990`. Deps: confirm Q3 (single client reader).

### S1.3 — Allow-list the `lang` param *(FR3, ADR-008)* · tier: thorough
Add `safeLang()` and apply at both forecast call sites before path joins.
- **Given** `?lang=../../x`, **when** forecast/month is requested, **then** a 400 is returned and no file outside `runDir` is read/written.
- **Given** `?lang=en|ru`, **then** it works as today.
- Files: `server.js:987,1028,992,1049,1062`. Deps: none.

### S1.4 — Security headers + static path boundary *(FR10, ADR-007)* · tier: smoke
Add security headers/CSP helper; fix `startsWith` separator.
- **Given** any response, **then** `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and a CSP are present.
- **Given** a sibling dir `public-x`, **when** requested, **then** it is NOT served (boundary uses `path.sep`).
- **Given** the SPA loads in a browser, **then** the CSP does not break it (tune inline-style/script allowances). 
- Files: `server.js:165-186,1111-1186`. Deps: none. *(CSP needs a browser smoke check — tier escalates to yolo for that step.)*

---

## E2 — Concurrency & data integrity  *(FR4, FR5, FR6)*

### S2.1 — Atomic, serialized JSON store *(FR4, ADR-003)* · tier: thorough
New `lib/store.js`: `writeJsonAtomic` (tmp+rename) + `withFileLock` mutex; route all profile/places writes through it.
- **Given** two concurrent profile mutations, **when** both complete, **then** neither update is lost and the file is valid JSON.
- **Given** a crash mid-write (simulated), **then** the original file is intact (no truncation).
- Files: `server.js:160,404-469` → `lib/store.js`. Deps: none. Concurrency test required (NFR2).

### S2.2 — Per-run report isolation *(FR5, ADR-004)* · tier: thorough
Pass run-scoped input/output paths to the Python CLI; remove shared `birth.json`/`latest.*` from the request path.
- **Given** two concurrent `POST /api/reports`, **then** each response reflects its own birth data (no cross-mixing).
- **Given** a successful run, **then** any "latest" pointer is written once via `writeJsonAtomic` outside the hot path.
- Files: `server.js:497-559,501-529`; verify CLI `--input/--out-*` (Q4). Deps: S2.1.

### S2.3 — Guarded data-file loads *(FR6, ADR-006)* · tier: smoke
Wrap `places.json` load; convert I/O/parse errors to clean `ValueError`/4xx.
- **Given** a missing/corrupt `places.json`, **when** resolving a place, **then** a clear error message is returned (no raw traceback).
- Files: `jyotish/engine/location.py:12`, `jyotish/cli.py:48-52`. Deps: none.

---

## E3 — Resource safety & resilience  *(FR7, FR8, FR9)*

### S3.1 — Subprocess & fetch timeouts *(FR7, ADR-005)* · tier: thorough
Timeout+kill in the `runPython` wrapper and `resolveIanaTimezone`; `AbortSignal.timeout` on OpenRouter fetch.
- **Given** a Python process that hangs, **when** the timeout elapses, **then** the child is killed and the request rejects with a clean 5xx (no leaked process).
- **Given** an unresponsive OpenRouter, **then** the chat request returns 504 within the timeout.
- Files: `server.js:240-250,561-578,801`. Deps: none.

### S3.2 — Bounded subprocess concurrency *(FR8, ADR-005)* · tier: thorough
`lib/pylimit.js` counting semaphore gating every spawn; month endpoint queues.
- **Given** many concurrent report/month requests, **then** concurrent Python processes never exceed `PY_MAX_CONCURRENCY`.
- **Given** the month endpoint, **then** its ~31 sub-calls run through the shared limiter, not all at once.
- Files: `server.js:561-578,1044-1069`. Deps: S3.1 (same wrapper).

### S3.3 — Crash handlers & safe error mapping *(FR9, ADR-006)* · tier: thorough
`lib/http.js` error mapping; `res.headersSent` guard; process handlers; stop reflecting stderr.
- **Given** an error after headers are sent, **then** no `ERR_HTTP_HEADERS_SENT` crash (guarded).
- **Given** an unknown run id, **then** 404 (not 500); bad percent-encoding → 400.
- **Given** any failure, **then** the client sees a generic message; full detail is logged server-side only.
- Files: `server.js:580-588,827,1518-1525,575`. Deps: none.

---

## E4 — Engine correctness  *(FR11, FR12, FR13, FR14; regression = FR23)*  — TDD: failing test first
Independent of Node work; can run in parallel.

### S4.1 — Fix first-mahadasha sub-periods *(FR11, ADR-009)* · tier: thorough
Resume antardashas mid-sequence from the birth nakshatra fraction; fix balance-row `duration_years`.
- **Given** a chart whose person is in their first mahadasha, **then** `current.antardasha` matches a hand-verified reference (new pinning test fails before the fix, passes after).
- **Given** the balance row, **then** `end − start == duration_years`.
- Files: `jyotish/engine/dashas.py:81,85-104`; `tests/test_dashas.py`. Deps: none.

### S4.2 — Fix Mangal Dosha mitigation + unmask test *(FR12, ADR-009)* · tier: thorough
Check `"own_sign"` (+ exalted/moolatrikona); correct the masking test fixture.
- **Given** own-sign Mars, **then** mitigation fires and the dosha penalty is not applied.
- **Given** `tests/test_compatibility.py:43`, **then** it uses the dignity value the engine actually emits and still passes.
- Files: `jyotish/engine/compatibility.py:453`; `tests/test_compatibility.py:43`. Deps: none.

### S4.3 — Unify "Dhanishta" spelling *(FR13)* · tier: smoke
Standardize on `Dhanishta` across transit tables.
- **Given** Moon in Dhanishta, **then** daily/haircut/travel lookups resolve (no silent miss); a test asserts inclusion.
- Files: `jyotish/engine/transits.py:112,1165,1342`. Deps: none.

### S4.4 — Birth-input validation *(FR14)* · tier: thorough
Pydantic validators for date/time; parse optional seconds.
- **Given** `birth_time="14:30:05"`, **then** it parses (no `ValueError`).
- **Given** `birth_date="2020-13-40"` or malformed time, **then** a clear validation error (not a crash deeper in the engine).
- Files: `jyotish/schemas.py:19-26`, `jyotish/engine/timezone.py:9`. Deps: none.

---

## E5 — Hygiene & quick wins  *(FR15, FR16, FR17, FR18)*

### S5.1 — Remove backup + dead code *(FR15, FR16)* · tier: smoke
`git rm public/app.js.bak_mojibake_fix`; gitignore `*.bak*`; delete `renderOverviewLegacy`/`renderTablesLegacy`.
- **Given** the repo, **then** no `*.bak*` is tracked and the two `*Legacy` functions are gone.
- **Given** the app loads, **then** it works (the removed functions were never called — confirm via grep).
- Files: `public/app.js:2105,2258`, `.gitignore`. Deps: none.

### S5.2 — Leaflet integrity + html lang *(FR17, FR18)* · tier: smoke
Self-host Leaflet (or add SRI); set `document.documentElement.lang` on language switch.
- **Given** the page, **then** Leaflet loads with integrity (self-hosted under `/vendor/` or SRI hash).
- **Given** a switch to English, **then** `<html lang>` becomes `en`.
- Files: `public/index.html:2,734-735`, `public/app.js` (lang handler). Deps: none.

---

## E6 — Performance hygiene  *(FR22)*

### S6.1 — CSV prewarm + static streaming/cache *(FR22, ADR-007)* · tier: smoke
Prewarm celebrities CSV at startup; stream static/vendor with cache headers.
- **Given** the first `/api/celebrities`, **then** it does not block the event loop (cache is warmed at startup).
- **Given** an immutable vendor asset, **then** it is streamed with a long-lived cache header (not `no-store`, not fully buffered).
- Files: `server.js:299-380,1111-1186`. Deps: none (coordinate header helper with S1.4).

---

## E7 — Test coverage & tooling  *(FR23, FR24, FR25)*
FR23 lands inside E4 stories; this epic is the standalone coverage + CI push.

### S7.1 — Engine coverage tests *(FR24)* · tier: thorough
Smoke/value tests for untested modules.
- **Given** ashtakavarga, **then** every BAV cell ∈ [0,8] and SAV column sums match.
- **Given** transits/astrocartography/dignity/houses/ephemeris/timezone, **then** a fixed-input smoke test asserts shape + bounds.
- Files: `tests/` (new). Deps: none.

### S7.2 — Dependency pinning & CI hygiene *(FR25)* · tier: smoke
Pin `requirements.txt`; add `ruff` + `pip-audit`; document one-command dev setup.
- **Given** `requirements.txt`, **then** versions are pinned (or a hash-locked lockfile exists).
- **Given** CI, **then** `ruff check` and `pip-audit` run; a documented command provisions engine deps and runs the suite.
- Files: `requirements.txt`, `pyproject.toml`, CI config, `README.md`. Deps: none.

---

## E8 — Structural refactors  *(STRETCH — FR19, FR20, FR21)*  — behavior-preserving, test-gated

### S8.1 — Split `transits.py` *(FR19, ADR-010)* · tier: thorough
Decompose into `panchanga`/`scoring`/`tips`/`indicators`/i18n behind the existing public surface.
- **Given** the split, **then** all engine outputs are byte-identical to pre-split (pinned by tests) and the suite is green.
- Files: `jyotish/engine/transits.py` → new modules. Deps: S4.3, S7.1 (tests must exist first).

### S8.2 — Modularize `app.js` *(FR20, ADR-010)* · tier: thorough
Migrate to `<script type="module">` split by feature; prove native ESM load first.
- **Given** a native-ESM load test, **then** the SPA loads and all tabs render with no console errors.
- **Given** TC3, **then** no mandatory bundler is introduced (or a build is added + documented).
- Files: `public/app.js` → feature `.mjs` modules; `index.html`. Deps: S5.1. *If native ESM proves infeasible without a build, DEFER.*

### S8.3 — Decompose `server.js` routing *(FR21, ADR-010)* · tier: thorough
Extract a route table + `store`/`python-bridge`/`markdown-export` modules.
- **Given** the decomposition, **then** every existing route behaves identically (smoke each endpoint) and the suite is green.
- Files: `server.js` → `lib/*`. Deps: S2.1, S3.x (reuse the lib modules already created).

---

## Reconciliation notes
- `lib/store.js` (S2.1), `lib/pylimit.js` (S3.2), `lib/http.js` (S3.3) are introduced IN-sprint and
  become the seams S8.3 builds on — sequence E2/E3 before attempting S8.3.
- The response-header helper is touched by S1.4 and S6.1 — land S1.4 first, S6.1 reuses it.
- E4 is the only epic that changes engine *output*; everything else is behavior-preserving.
