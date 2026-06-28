---
sprint: sprint-001
created: 2026-06-27
validation_status: ready
---

# Readiness Report — Sprint 001 Quality Remediation

## FR coverage (25/25 mapped)
| FR | Story | FR | Story | FR | Story |
|---|---|---|---|---|---|
| FR1 | S1.1 | FR10 | S1.4 | FR19 | S8.1 ⟂ |
| FR2 | S1.2 | FR11 | S4.1 | FR20 | S8.2 ⟂ |
| FR3 | S1.3 | FR12 | S4.2 | FR21 | S8.3 ⟂ |
| FR4 | S2.1 | FR13 | S4.3 | FR22 | S6.1 |
| FR5 | S2.2 | FR14 | S4.4 | FR23 | E4 (woven) |
| FR6 | S2.3 | FR15 | S5.1 | FR24 | S7.1 |
| FR7 | S3.1 | FR16 | S5.1 | FR25 | S7.2 |
| FR8 | S3.2 | FR17 | S5.2 | | |
| FR9 | S3.3 | FR18 | S5.2 | | |

⟂ = STRETCH. **No orphan FRs; no orphan stories.**

## NFR coverage
- **NFR1** (no regression) — every story keeps `pytest`+`node --check` green; E4 is TDD.
- **NFR2** (concurrency safety) — explicit concurrency tests in S2.1/S2.2.
- **NFR3** (bounded resources) — S3.1 timeouts, S3.2 semaphore.
- **NFR4** (secret confidentiality) — S1.2.
- **NFR5** (frontend/API stability) — ADR-009 preserves engine output; S1.2 updates client in lockstep.

## Health checks
- ✅ Baseline verified green this session: **43 passed in 1.57s**; `node --check` passes on all JS.
- ✅ Every story names concrete `file:line` targets and BDD criteria.
- ✅ Dependency order captured (E2/E3 lib modules precede S8.3; S1.4 header helper precedes S6.1; E4 tests precede S8.1).
- ✅ Only E4 changes engine output — isolated and test-pinned.
- ⚠️ **Open questions to resolve during execution:** Q3 (single client reader of the key — gates S1.2), Q4 (Python CLI `--out-*` surface — gates S2.2). Both are quick greps, not blockers.
- ⚠️ **CSP tuning (S1.4)** needs a real browser smoke check — the SPA uses inline styles; start permissive, tighten iteratively.
- ⚠️ **S8.2 gate:** if native ESM can't load the split `app.js` without a bundler, DEFER it (honors TC3) rather than forcing a build.

## Sizing
19 IN stories across 7 epics (standard-to-ambitious) + 3 STRETCH. Recommended execution order:
**E1 → E2 → E3** (security/integrity/resilience, share `lib/*`), **E4 in parallel** (engine, independent),
then **E5 → E6 → E7**, then **E8** only if IN completes.

## Verdict: READY FOR EXECUTION
Plan is complete, traceable, and grounded in a verified green baseline. Recommend starting with
**E1** (loopback bind + key non-disclosure) — highest severity, lowest effort, no dependencies.
