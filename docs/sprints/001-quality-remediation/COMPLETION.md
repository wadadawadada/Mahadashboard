---
sprint: sprint-001
executed: 2026-06-27
in_scope_status: COMPLETE + VERIFIED + INDEPENDENTLY REVIEWED
stretch_status: NOT STARTED (opt-in)
---

## Independent review (post-execution, separate code-reviewer pass)
An independent opus code-reviewer audited the diff against the ADRs. It confirmed the high-risk
new logic correct (store mutex/atomic writes, pylimit semaphore, per-run isolation, timeouts,
error mapping, dashas, compatibility) and green status real — and caught **two issues the
executors missed**, both now FIXED and live-verified:
- **[HIGH] POST `/api/settings` still echoed the API key** (NFR4). Fixed (`server.js:932`): POST now
  returns the same safe flat shape as GET. Verified live — POSTing a fake key returns
  `{ok,has_key,model,base_url,needs_setup}` with no key in the body.
- **[MEDIUM] client read stale `data.settings.*` shape** while the server returns flat. Fixed
  (`public/app.js`): settings modal now reads `data.has_key`/`data.model`.
Re-verified after the fixes: pytest 90 passed, web-static PASS, node --check clean.

# Sprint 001 — Execution Completion Report

## Verification baseline (all green)
- `pytest -q` → **90 passed** (43 baseline + 47 new), 0 failures.
- `node --check` → server.js, lib/store.js, lib/pylimit.js, public/app.js, public/chart3d.mjs all OK.
- `npm run test:web` (web-static) → **PASS** (reconciled).
- **Headless-Chromium smoke** (real `/usr/bin/chromium` via playwright-core, loopback server): `GET /`→200, `chart3d.mjs` import resolves `renderChart3D` (full three.js + 13 vendored addons graph), self-hosted Leaflet present, **0 CSP violations, 0 console errors, 0 failed requests** — re-confirmed after the CSP was tightened.

## IN epics — status

| Epic | Stories | Status |
|---|---|---|
| E1 Lock down surface | S1.1 loopback bind · S1.2 key non-disclosure · S1.3 lang allow-list · S1.4 headers+CSP+path.sep | ✅ DONE |
| E2 Concurrency & integrity | S2.1 atomic+serialized store (`lib/store.js`) · S2.2 per-run isolation · S2.3 guarded loads | ✅ DONE |
| E3 Resource safety | S3.1 subprocess/fetch timeouts · S3.2 spawn semaphore (`lib/pylimit.js`) · S3.3 crash handlers+safe errors | ✅ DONE |
| E4 Engine correctness | S4.1 mahadasha · S4.2 mangal+unmask · S4.3 Dhanishta · S4.4 input validation | ✅ DONE (values **pending astrologer sign-off** — see below) |
| E5 Hygiene | S5.1 rm `.bak`+dead code · S5.2 self-host Leaflet+`lang` | ✅ DONE |
| E6 Performance | S6.1 CSV prewarm + static streaming/cache | ✅ DONE |
| E7 Tests & tooling | S7.1 engine coverage (+47 tests) · S7.2 pin deps + ruff/pip-audit CI + README | ✅ DONE |

### Integration fixes done during execution (beyond the story list)
- **Vendored the three.js addon import-closure** (13 files under `public/vendor/three/addons/`). The importmap referenced `three.module.js`/`three.core.js`/`three/addons/` that were **never committed** — the 3D chart was broken at HEAD. Now self-hosted and smoke-verified.
- **Tightened the CSP** to drop the now-unused `unpkg` origin (Leaflet self-hosted); re-smoked clean.
- **`.env.example`** gained `HOST`, `PY_TIMEOUT_MS`, `PY_MAX_CONCURRENCY`.

## ⚠️ NEEDS HUMAN / COLLABORATION (the places the solution wasn't self-evident)

### 1. Astrology values — PENDING ASTROLOGER SIGN-OFF (blocking real correctness confidence)
The E4 fixes implement the **canonical algorithm**; the expected values in the new tests were **computed by the corrected code**, not independently verified. Neither the implementer nor the orchestrator can confirm the astrology — only the author/an expert can. Full detail with before→after examples and the exact questions to answer is in **`EXPERT-REVIEW-NEEDED.md`**. Summary of what needs confirming:
- **S4.1 dasha:** resume-mid-sequence antardasha identities (e.g. on the pinned 1990-06-15 chart, 1995-01-01 now reports Venus→Rahu, was Venus→Mars), and the display convention (first mahadasha shown from birth with balance length).
- **S4.2 mangal:** the cancellation set (`own_sign`/exalted/moolatrikona) and its *strength* (reduce-afflicting-count-by-one vs full cancel).
- **S4.3 dhanishta:** the romanization and the now-active haircut/travel/nature ratings.
- One schema change to eyeball: `MahadashaEntry.duration_years` widened `int → float` (verified JS-display-safe).

### 2. STRETCH epic E8 — not started (opt-in)
FR19 split `transits.py`, FR20 `app.js` → ES modules, FR21 decompose `server.js`. Behavior-preserving + test-gated per ADR-010. Recommend landing/committing the IN work first, then doing these on a clean base. S8.2 keeps its DEFER-if-native-ESM-infeasible gate.

### 3. Smaller follow-ups (documented, low-risk)
- **Ruff cleanup:** 166 findings (116 are `E501` line-length in the bilingual tables; ~30 auto-fixable). CI ruff step is **non-blocking** for now (`continue-on-error`); a cleanup story makes it blocking.
- **`uv.lock`** is currently minimal — run `uv lock`, then make `pip-audit` blocking in CI.
- **`playwright-core`** was added as a **devDependency** for the headless smoke (no browser download; uses system chromium). Remove if unwanted.
- **`.env` writes** (`saveOpenRouterSettings`) are not atomic — route through `writeJsonAtomic` in a follow-up (low-frequency, single-user).
- **CLI subfolder side-effect:** `jyotish/cli.py report` also writes a `{slug}_{timestamp}/` copy next to outputs; now contained inside `runDir`, harmless but redundant — drop the copy step if desired.
- **CSP next step:** give the inline importmap a nonce so `script-src` can drop `'unsafe-inline'`.

## Files changed
- **New:** `lib/store.js`, `lib/pylimit.js`, `public/vendor/**` (leaflet + three + 13 addons), `.github/workflows/ci.yml`, `tests/test_engine_coverage.py`, `tests/test_transits.py`, `tests/test_validation.py`, `docs/sprints/001-quality-remediation/**`, `uv.lock`.
- **Modified:** `server.js`, `jyotish/engine/{dashas,compatibility,location,timezone,transits}.py`, `jyotish/schemas.py`, `tests/{test_dashas,test_compatibility,web-static.check}.*`, `public/{app.js,index.html}`, `.env.example`, `.gitignore`, `requirements.txt`, `pyproject.toml`, `README.md`, `package.json`, `package-lock.json`.
- **Removed:** `public/app.js.bak_mojibake_fix` (git rm).

## Not committed
Changes are left in the working tree for review. No commit was made (awaiting go-ahead).
