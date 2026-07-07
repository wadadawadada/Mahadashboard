---
project: Mahadashboard (jyotish-service)
sprint: sprint-001
product: null
created: 2026-06-27
steering_mode: GUIDED
previous_sprint: null
input_quality: structured-brief
source_prd: docs/sprints/001-quality-remediation/product-brief.md
---

## Product Vision
Harden Mahadashboard so it is safe to run, correct in its core astrology output, and
maintainable — without regressing the working app or its 43 green tests. Each requirement
traces to a finding in `product-brief.md`.

## Functional Requirements

### Security & access (maps C1, H1, H5)
#### FR1: Restrict network exposure
Server must not bind to all interfaces by default. Bind `127.0.0.1` (configurable via env),
and/or gate `/api/*` behind a shared-secret token. Source: `server.js:1539`. (→ C1/H1)

#### FR2: Stop disclosing the OpenRouter API key
`GET /api/settings` must never return the key. Return `{ has_key: bool, model, needs_setup }`
only; the client must stop populating the key input from the response. (`server.js:834-836`, `app.js:1962`) (→ C1)

#### FR3: Validate the `lang` parameter
Allow-list `lang ∈ {ru,en}` before it is used in any filesystem path, matching the existing
`method` allow-listing. (`server.js:987,1028`) (→ H5)

### Data integrity (maps C2, C3, M3)
#### FR4: Concurrency-safe profile store
Serialize all `profiles.json` mutations through an in-process async mutex/queue and persist
via temp-file + atomic `fs.rename`. No lost updates under concurrent requests. (`server.js:404-469,160`) (→ C2)

#### FR5: Per-run report isolation
Report generation must read/write only inside the per-run `runDir`; eliminate the shared
`data/input/birth.json` and `data/reports/latest.*` paths from the request path. (`server.js:501-529`) (→ C3)

#### FR6: Guarded data-file loads
`places.json` (and similar) loads must catch I/O/parse errors and surface a clean `ValueError`/
4xx, never an uncaught traceback. (`location.py:12`, `cli.py:48-52`) (→ M3)

### Resource safety & resilience (maps H2, H3, H4, M7, M10)
#### FR7: Subprocess & fetch timeouts
`runPython`, `resolveIanaTimezone`, and the OpenRouter `fetch` must enforce a timeout that
kills the child / aborts the request and rejects cleanly. (`server.js:561-578,240-250,801`) (→ H2)

#### FR8: Bounded subprocess concurrency
A process-wide semaphore caps total concurrent Python spawns across all endpoints; the
month endpoint must not fan out unbounded. Optional per-IP rate limit. (`server.js:1044-1069`) (→ H3)

#### FR9: Crash resilience & safe error responses
Add `unhandledRejection`/`uncaughtException` handlers; guard responders with `res.headersSent`;
map `ENOENT`→404 and bad percent-encoding→400; stop reflecting raw Python stderr/`error.detail`
to clients. (`server.js:1518-1525,580-588,827,575`) (→ H4/M7/M10)

#### FR10: Baseline security headers
Set `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, a conservative
`Content-Security-Policy`, and fix the `startsWith(PUBLIC_DIR)` boundary to include `path.sep`. (`server.js:1111-1186`) (→ M11)

### Engine correctness (maps H6, H7, M1, M2)
#### FR11: Correct first-mahadasha sub-periods
Vimshottari antardashas inside the birth (balance) mahadasha must resume mid-sequence from the
elapsed nakshatra fraction, not restart at the lord's first sub-period. `duration_years` for the
balance row must equal `end−start`. (`dashas.py:81,85-104`) (→ H6)

#### FR12: Correct Mangal Dosha mitigation
Mitigation must test the dignity value the engine actually emits (`"own_sign"`, plus exalted/
moolatrikona as applicable). (`compatibility.py:453`) (→ H7)

#### FR13: Unify nakshatra spelling
Standardize on the canonical `Dhanishta` everywhere so transit/haircut/travel lookups don't
silently miss. (`transits.py:112,1165,1342`) (→ M1)

#### FR14: Birth-input validation
Add pydantic validators for `birth_date` (`YYYY-MM-DD`) and `birth_time` (`HH:MM[:SS]`), and
parse optional seconds in time handling. (`schemas.py:19-26`, `timezone.py:9`) (→ M2)

### Maintainability & hygiene (maps M4, M5, M6, M8, M9, L1–L4)
#### FR15: Remove tracked backup + ignore backups
`git rm public/app.js.bak_mojibake_fix`; add `*.bak*` to `.gitignore`. (→ L1)

#### FR16: Delete dead frontend code
Remove `renderOverviewLegacy` and `renderTablesLegacy` (never called). (→ L2)

#### FR17: Leaflet integrity
Self-host Leaflet under `/vendor/` (like three.js) or add SRI hash + `crossorigin`. (`index.html:734`) (→ L3)

#### FR18: Correct `lang` attribute
Update `document.documentElement.lang` on language switch. (`index.html:2`) (→ L4)

#### FR19: Split the `transits.py` god-module
Decompose 1,380-LOC `transits.py` into `panchanga` / `scoring` / `tips` / `indicators` / i18n
modules behind the existing public surface, with tests pinning behavior. (→ M5)  *[large]*

#### FR20: Modularize `app.js`
Migrate the 8,365-LOC global script to `<script type="module">` split by feature
(chart/tables/dasha/forecast/synastry/chat/i18n), following the `chart3d.mjs` pattern. (→ M6)  *[large]*

#### FR21: Decompose `server.js` routing
Extract a route table + `store` / `python-bridge` / `markdown-export` modules from the
~280-line `route()` and ~300-line `buildExportMarkdown`. (→ M4)  *[large]*

#### FR22: Performance hygiene
Pre-warm the celebrities CSV cache at startup (off the request path) and stream static/vendor
assets with appropriate cache headers (ETag/Last-Modified; long-lived for immutable vendor). (`server.js:299-380,1111-1186`) (→ M8/M9)

### Tests & tooling (maps H6/H7 masking, L5, L6)
#### FR23: Regression tests for the correctness fixes
Add value-level tests asserting antardasha *identity* near birth, Mangal mitigation for own-sign
Mars, and Dhanishta inclusion — and fix `test_compatibility.py:43` which currently masks FR12.
Suite must stay green. (→ H6/H7)

#### FR24: Coverage for untested engine modules
Add smoke/value tests for `transits`, `astrocartography`, `ashtakavarga` (BAV∈[0,8], SAV sums),
`dignity`, `houses`, `ephemeris`, `timezone`. (→ L6)

#### FR25: Dependency pinning & CI hygiene
Pin `requirements.txt` to exact versions (or hash-locked `uv.lock`); add `pip-audit` and `ruff`
to a CI check; document a one-command dev setup that installs engine deps. (→ L5)

## Non-Functional Requirements
### NFR1: No correctness regression
Full `pytest` suite stays green (baseline 43 passing). Engine numeric output is unchanged except
the deliberately corrected dasha (FR11) and Mangal (FR12) values, which gain pinning tests.

### NFR2: Concurrency safety
With N concurrent report/profile requests, no lost writes and no cross-request data leakage
(verified by a concurrency test).

### NFR3: Bounded resources
No request can spawn unbounded subprocesses; wedged children are killed within the timeout;
the server survives malformed input and upstream stalls without crashing.

### NFR4: Secret confidentiality
The OpenRouter key never appears in any HTTP response, client DOM, or log line.

### NFR5: Frontend/API stability
The SPA keeps working after the backend changes; the JSON API contract consumed by `app.js`
is preserved (or updated in lockstep for FR2).

## Technical Constraints
### TC1: Stay dependency-light
Backend is intentionally Node-stdlib-only (sole prod dep `three`). Mutex/semaphore/rate-limit
must be in-process, no external store or new heavy dependency without justification.

### TC2: Deterministic engine
Python 3.10+, `pyswisseph`; the calculation path stays offline/deterministic. Fixes must not
introduce wall-clock/network dependence into the engine.

### TC3: No mandatory build step (frontend)
The app currently ships unbundled. FR20's ES-module migration must work via native ESM (no
required bundler) — or, if a build is introduced, it must be optional and documented.

### TC4: Single-process server
One Node process; concurrency primitives are in-memory and reset on restart (acceptable for a
self-hosted single-instance deployment).

## Open Questions
- **Q1 (→ Phase 1B/2A):** Deployment model — strictly localhost single-user, or LAN/multi-user?
  This sets whether FR1 is "bind 127.0.0.1" (sufficient) or "bind + token auth" (needed). Drives C1/H1 severity.
- **Q2 (→ Phase 1B):** Are the three large refactors (FR19/FR20/FR21) IN this sprint, STRETCH, or DEFER?
  They are high-effort/low-urgency and risk eclipsing the must-fix security/correctness work.
- **Q3 (→ 2A):** FR2 changes the `/api/settings` response shape — confirm no other client reads `openrouter_api_key`.
- **Q4 (→ 2A):** Mutex vs serialized write-queue for FR4, and whether FR5 changes the Python CLI's `--out-*` flags.

## Scope Boundaries
### In Scope
- All security, data-integrity, resilience, and engine-correctness fixes (FR1–FR14).
- Hygiene quick wins (FR15–FR18) and performance hygiene (FR22).
- Regression + gap tests and CI/dep hygiene (FR23–FR25).

### Out of Scope
- A full authentication/identity system, multi-tenant accounts, or a database migration.
- Rewriting the astrology engine or changing its numeric methods (beyond the two bug fixes).
- A UI redesign or new product features.
- Adopting a frontend framework or a mandatory bundler.

### Scope risk (flagged for Phase 1B)
FR19/FR20/FR21 are large structural refactors. Recommended split: **IN** = FR1–FR18, FR22–FR25;
**STRETCH/DEFER** = FR19, FR20, FR21. To be confirmed with the user in scoping.

## Assumptions
| Assumption | Validation Method | Impact if Wrong |
|---|---|---|
| App is run self-hosted, low-concurrency, by/for its owner | Confirm with user (Q1) | If multi-user/LAN, FR1 must add real auth, not just localhost bind |
| `openrouter_api_key` is only read by the settings UI in `app.js` | grep client for the field (Q3) | FR2 could break another consumer |
| The two engine bugs (FR11/FR12) are real, not intended quirks | Domain check + pinning tests | Fix would change "correct" output the user relied on |
| ES modules work unbundled in target browsers | Manual load test of `chart3d.mjs` pattern | FR20 needs a build step (changes TC3) |
| The 43-test baseline reflects current intended behavior | Run suite before/after each change | Hidden reliance on buggy output |

## Existing Codebase Inventory
Summarized in `discovery.md`. Key constraints for these requirements: subprocess invocation is
already injection-safe (array args + JSON-file input — preserve this); ids are UUID-validated;
bodies capped at 2MB; AI-chat XSS already mitigated; `chart3d.mjs` is the reference ES-module
pattern for FR20. The backend is stdlib-only — honor TC1.
