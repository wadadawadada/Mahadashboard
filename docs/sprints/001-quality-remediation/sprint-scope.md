---
sprint: sprint-001
created: 2026-06-27
sprint_size: standard
deployment_model: localhost-single-user
---

# Sprint Scope — Quality Remediation

## Steering decisions (GUIDED)
- **D-001 — Refactor handling: STRETCH.** FR19/FR20/FR21 (the three large refactors) are
  attempted only if the IN set completes; they ship behind passing regression tests and must
  not change public behavior. Source: user, Phase 1B.
- **D-002 — Deployment: localhost single-user.** FR1 = bind `127.0.0.1` (env-overridable);
  no auth system this sprint. C1/H1 reclassified **Critical→Medium** once the loopback bind
  lands (key still over-exposed to the local browser, so FR2 stays IN). Source: user, Phase 1B.

## IN (committed) — 7 epics, 19 stories
| Cluster | FRs |
|---|---|
| E1 Lock down the surface | FR1, FR2, FR3, FR10 |
| E2 Concurrency & data integrity | FR4, FR5, FR6 |
| E3 Resource safety & resilience | FR7, FR8, FR9 |
| E4 Engine correctness | FR11, FR12, FR13, FR14 |
| E5 Hygiene & quick wins | FR15, FR16, FR17, FR18 |
| E6 Performance hygiene | FR22 |
| E7 Test coverage & tooling | FR23, FR24, FR25 |

## STRETCH — 1 epic, 3 stories (attempt only if IN completes)
| Cluster | FRs |
|---|---|
| E8 Structural refactors | FR19 (transits.py), FR20 (app.js ESM), FR21 (server.js) |

## DEFER / Out of scope
- Real authentication / multi-user accounts / public-internet exposure (follows from D-002).
- Engine method changes beyond the two bug fixes; UI redesign; framework/bundler adoption.

## Sequencing rationale
Security + data-integrity (E1, E2) first — they are the highest-severity and lowest-effort.
Resilience (E3) next. Engine correctness (E4) is independent and can run in parallel with the
Node work. Hygiene (E5) and perf (E6) are low-risk fillers. Tests (E7) are partly woven into
E4 (regression for FR11/FR12) and partly a standalone coverage push. STRETCH (E8) last.
