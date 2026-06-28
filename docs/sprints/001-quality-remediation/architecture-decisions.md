---
sprint: sprint-001
created: 2026-06-27
steering_mode: GUIDED
constraints: [TC1 stdlib-only, TC2 deterministic engine, TC3 no mandatory build, TC4 single-process]
---

# Architecture Decisions

Decisions are auto-resolved under the established constraints (D-001 STRETCH refactors,
D-002 localhost single-user, TC1 stay stdlib). None remaining rise to CRITICAL after the
two steering decisions, so no further elicitation pause is required; each is logged below.

### ADR-001 — Network bind via env (FR1)
Add `HOST` env (default `127.0.0.1`); `server.listen(PORT, HOST)`. Document that exposing
beyond loopback requires adding auth (out of scope). *Rejected:* building token auth now —
unneeded for single-user (D-002). **Significance: HIGH → settled by D-002.**

### ADR-002 — Settings response shape (FR2)
`GET /api/settings` → `{ has_key: boolean, model, base_url, needs_setup }`; never the key.
Client shows a masked placeholder and only sends a key on save (POST unchanged). Confirm
`app.js` reads the field in exactly one place (Q3) before changing. **Significance: MEDIUM** (API-contract change, frontend lockstep).

### ADR-003 — Atomic, serialized JSON store (FR4)
One small in-process module: `writeJsonAtomic(path,obj)` (write tmp in same dir → `fs.rename`)
plus a per-file promise-chain mutex `withFileLock(path, fn)`. All `profiles.json`/`places.json`
mutations route through it. No external lock/dep (TC1). **Significance: MEDIUM.**

### ADR-004 — Per-run report isolation (FR5)
Pass run-scoped `--input`/`--out-*` paths (inside `runDir`) to the Python CLI; remove
`data/input/birth.json` and the request-path writes to `data/reports/latest.*`. If the UI needs
a "latest" pointer, write it once post-success via `writeJsonAtomic`, outside the hot path.
Verify the CLI flag surface (Q4). **Significance: MEDIUM** (touches Python CLI contract).

### ADR-005 — Subprocess governance (FR7, FR8)
New `runPython` wrapper: (a) `setTimeout`→`child.kill('SIGKILL')`+reject (default 30s, env
`PY_TIMEOUT_MS`); (b) a counting **semaphore** (default `os.cpus().length`, env `PY_MAX_CONCURRENCY`)
gating every spawn across all endpoints, so the month endpoint queues instead of fanning out.
OpenRouter `fetch` gets `AbortSignal.timeout(60_000)`→504. In-process, stdlib only (TC1). **Significance: MEDIUM.**

### ADR-006 — Centralized error→HTTP mapping (FR9)
Single error handler: guard with `if (!res.headersSent)`; map `ENOENT`→404, `URIError`→400,
`ApiError`→its status; send a generic client message while logging full detail server-side
(stop forwarding Python stderr). Add top-level `process.on('unhandledRejection'|'uncaughtException')`
that log and keep serving. **Significance: MEDIUM.**

### ADR-007 — Security headers + static boundary (FR10)
Response helper sets `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
`Referrer-Policy: same-origin`, and `Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'`
(loosened only as the SPA requires). Fix `startsWith(PUBLIC_DIR)`→`startsWith(PUBLIC_DIR + path.sep)`
and handle the exact-dir case. **Significance: MEDIUM** (CSP may need tuning vs inline styles — verify in browser).

### ADR-008 — Shared `lang` allow-list (FR3)
`safeLang(x)` returns `x` if `∈{ru,en}` else 400; reuse at both forecast call sites before any
path join. **Significance: LOW.**

### ADR-009 — Localized engine fixes, test-pinned (FR11–FR14)
All four engine fixes are local edits in their modules; no schema/API change (NFR5). Each lands
**with its regression test in the same story** (FR23), and `test_compatibility.py:43` is corrected
to stop feeding a value the engine never emits. **Significance: HIGH** (changes "correct" output — pin with tests, validate against a known chart).

### ADR-010 — Stretch refactors are behavior-preserving (FR19–FR21)
Each refactor keeps the existing public surface (engine function signatures; `server.js` routes;
`app.js` global entry points or a thin compat shim). Gate: full suite green before/after; for FR20,
prove native-ESM load works (TC3) before committing — else defer. **Significance: MEDIUM, STRETCH.**

## Cross-cutting
- **New shared modules (Node, stdlib):** `lib/store.js` (ADR-003), `lib/pylimit.js` (ADR-005),
  `lib/http.js` (ADR-006/007 helpers). These also seed the FR21 decomposition.
- **No new runtime dependencies** (TC1). Dev-only additions: `ruff`, `pip-audit` (FR25).
- **Test-first for correctness:** E4 stories write the failing test, then fix (TDD), satisfying NFR1.
