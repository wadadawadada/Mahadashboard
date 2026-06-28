# Expert Review Needed — Engine Correctness Fixes (Sprint 001, Epic E4)

**Status:** the code changes below are implemented and covered by automated
"pinning" tests. **However, the engineering team cannot authoritatively confirm
the astrologically-correct output — only a domain expert can.** Every expected
value in the tests was *computed by the corrected algorithm itself* and is
therefore marked **"PENDING ASTROLOGER SIGN-OFF."**

This document is written to be self-contained for a non-coder astrologer. For
each fix it states: **(a)** the bug, **(b)** the canonical algorithm we
implemented and our reasoning/source, **(c)** a concrete before → after example
from a specific birth chart, and **(d)** the precise question you must answer to
confirm or correct us.

If any "after" value is wrong, tell us the correct value and the rule, and we
will update the code and its pinning test.

---

## Fix 1 — First-mahadasha antardasha (bhukti) sub-periods (Vimshottari)

**Files:** `jyotish/engine/dashas.py`
**Test:** `tests/test_dashas.py` (`test_first_mahadasha_*`)

### (a) The bug
At birth, a person is almost always **partway through** their first mahadasha
(the "balance" dasha). The old code restarted **all nine** antardashas of that
first mahadasha from the mahadasha lord's own sub-period and squeezed them into
the remaining balance period. This produced the **wrong antardasha** for the
native's early life.

### (b) The canonical algorithm we implemented
Standard Vimshottari (Parashara / BPHS) rule:

1. The first mahadasha is displayed **starting at birth**, lasting only the
   **balance** (the unelapsed remainder of the dasha at birth).
2. Within a mahadasha, the nine antardashas run in the fixed Vimshottari order
   starting from the mahadasha lord, each lasting
   `(antardasha-lord years / 120) × (full mahadasha years)`.
3. Because part of the first mahadasha already elapsed **before** birth, its
   antardashas must **resume mid-sequence**: the sub-period that is *running at
   birth* is the first one shown (clipped to begin at the birth moment), and the
   sub-periods that already finished before birth are **not** shown. The total
   of the shown sub-periods exactly equals the balance period.
4. We also corrected the first mahadasha's displayed `duration_years` so that
   `end − start == duration_years` (it now shows the **balance** length, e.g.
   ~15 years, not the full 20-year period — the full length is still implied by
   the sequence and `balance_days`).

**Our reasoning/source:** this is the textbook "balance of dasha" treatment used
by mainstream Jyotish software (e.g. Jagannatha Hora, Parashara's Light): the
first dasha is anchored at birth with its balance, and bhuktis resume from the
one operating at birth. We did **not** invent any new math.

### (c) Concrete before → after example
**Birth chart (fixed, no real person):** 15 June 1990, 12:00 UTC; Moon at
**136.6667° sidereal** → nakshatra **Purva Phalguni** → **Venus** mahadasha.
About 5 of Venus's 20 years had already elapsed at birth, so the **balance is
~15 years** (Venus mahadasha shown from birth to ~June 2005). Observation date:
**1 January 1995** (the native is still in the first/Venus mahadasha).

| | Antardasha running on 1995-01-01 | First antardasha shown for the Venus mahadasha | Venus mahadasha sequence shown |
|---|---|---|---|
| **Before (buggy)** | **Venus → Mars** | Venus → **Venus** | Venus, Sun, Moon, Mars, Rahu, Jupiter, Saturn, Mercury, Ketu (all 9, compressed into 15 yrs) |
| **After (corrected)** | **Venus → Rahu** | Venus → **Moon** | Moon, Mars, Rahu, Jupiter, Saturn, Mercury, Ketu (7; Venus & Sun bhuktis already elapsed before birth) |

So the headline change: on 1 Jan 1995 the engine used to say the native was in
**Venus–Mars**; it now says **Venus–Rahu**.

### (d) Question for the expert — PENDING SIGN-OFF
1. For a native in their **first** mahadasha, do you agree the antardasha
   sequence should **resume from the bhukti running at birth** (omitting the
   already-elapsed bhuktis), rather than restarting from the mahadasha lord?
2. Do you agree the first mahadasha should be **displayed starting at birth**
   with the **balance** length (so its first shown antardasha begins at birth)?
   Or do you prefer the first mahadasha and bhuktis to be shown from their true
   (pre-birth) start dates?
3. For the example above, is **Venus–Rahu** the correct antardasha on
   1995-01-01, and is **Venus–Moon** the correct first shown bhukti?

---

## Fix 2 — Mangal Dosha (Mars affliction) mitigation by dignity

**Files:** `jyotish/engine/compatibility.py`
**Test:** `tests/test_compatibility.py` (`test_own_sign_mars_mitigates_dosha`,
`test_mangal_mismatch_adds_readable_warning_and_penalty`)

### (a) The bug
The Mangal-dosha mitigation checked whether Mars's dignity was `"own"`, but the
engine's dignity function **never emits `"own"`** — it emits **`"own_sign"`**.
As a result, **mitigation never fired**: a strong, own-sign Mars was still
counted as fully afflicted in compatibility scoring.

### (b) The canonical algorithm we implemented
We changed the mitigation check to the value the engine actually produces:
Mangal dosha is **mitigated when Mars is in its own sign, exalted, or
moolatrikona** (`{"own_sign", "exalted", "moolatrikona"}`). The existing
mitigation strength was left unchanged: a mitigated Mars **reduces the count of
afflicting placements by one** (so a single affliction in own/exalted sign is
neutralized).

**Our reasoning/source:** a classically accepted set of Mangal-dosha
cancellations (Mangal Dosha Bhanga) includes Mars occupying its own or
exaltation sign. We implemented exactly the dignity-based mitigation the original
author intended; we only corrected the value string so it can actually match.
(Note: the engine's dignity function currently never returns `"moolatrikona"`;
we left it in the set for forward-compatibility, but today only `own_sign` and
`exalted` can trigger it.)

### (c) Concrete before → after example
**Chart:** Lagna **Scorpio**, **Mars in Scorpio** (its own sign), in the 1st
house — exactly **one** Mangal placement, and Mars is dignified.

| | Mars mitigated? | Mangal dosha present? |
|---|---|---|
| **Before (buggy)** | No (check looked for `"own"`, never produced) | **Yes** — single affliction counted |
| **After (corrected)** | **Yes** (`own_sign`) | **No** — the one affliction is cancelled |

### (d) Question for the expert — PENDING SIGN-OFF
1. Do you agree Mangal dosha should be **mitigated when Mars is in its own sign
   or exaltation** (and moolatrikona)?
2. Is "**reduce the number of afflicting houses by one**" the correct *strength*
   of this mitigation, or should a dignified Mars cancel the dosha entirely
   regardless of how many houses are afflicted?
3. Should any **other** classical cancellations also be implemented (e.g. Mars
   aspected by/with Jupiter, certain sign placements, both partners afflicted)?
   These are currently **not** implemented.

---

## Fix 3 — "Dhanishta" vs "Dhanishtha" spelling unification

**Files:** `jyotish/engine/transits.py`
**Test:** `tests/test_transits.py` (`test_moon_in_dhanishta_is_scored_not_silently_missed`)

### (a) The bug
The canonical nakshatra list spells the 23rd nakshatra (धनिष्ठा) **"Dhanishta"**,
but the transit scoring tables spelled it **"Dhanishtha"** in three places. Since
lookups are by exact string, a **Moon in this nakshatra silently fell through**
the daily/haircut/travel/finance scoring tables — scoring it as if the nakshatra
were unlisted (effectively neutral) instead of applying its real rating.

### (b) The fix
We standardized every occurrence on **"Dhanishta"** (matching the engine's
canonical nakshatra list and the compatibility module, which already used
"Dhanishta"). This is an **orthography fix** — it is the **same nakshatra** either
way; only the lookup key changed so the existing ratings now actually apply.

### (c) Concrete before → after example
For a date when the **Moon is in Dhanishta** (and a non-special tithi):

| Indicator | Before (silent miss) | After (table applies) |
|---|---|---|
| Haircut | neutral/good (nakshatra unrecognized) | **bad** (Dhanishta is in the "avoid" list) |
| Travel | neutral/good (nakshatra unrecognized) | **bad** (Dhanishta is in the "avoid" list) |

### (d) Question for the expert — PENDING SIGN-OFF
1. Is **"Dhanishta"** the romanization you want standardized in the UI/output?
2. The unification now makes the **existing** ratings for this nakshatra take
   effect — please confirm those ratings are correct: haircut = **avoid**,
   travel = **avoid**, and the nakshatra "nature" weight of **+0.4** (mildly
   benefic) used in daily scoring. If any are wrong, give the correct value.

---

## Changes that do NOT alter astrology values (no sign-off needed, FYI)

These were also implemented this sprint but are pure robustness/validation/test
work and **do not change any astrological calculation**:

- **Input validation** (`jyotish/schemas.py`, `jyotish/engine/timezone.py`):
  `birth_date` must be a real `YYYY-MM-DD` date and `birth_time` a valid
  `HH:MM` or `HH:MM:SS`; the engine now also accepts times with seconds. Invalid
  inputs now raise a clear validation error instead of crashing deeper in the
  engine.
- **Guarded data-file load** (`jyotish/engine/location.py`): a missing or
  corrupt `places.json` now raises a clean, readable error instead of an
  uncaught traceback.
- **New engine tests** (`tests/`): coverage for ashtakavarga (every BAV cell is
  0–8 and the Sarvashtakavarga column sums are consistent), transits,
  astrocartography, dignity, houses, ephemeris, and timezone. These pin current
  behavior; they assert structure and sane bounds, not new astrological claims.

---

## Summary of "NEEDS HUMAN / COLLABORATE" items

| # | Item | Expected value (PENDING SIGN-OFF) | Who must confirm |
|---|---|---|---|
| 1 | First-mahadasha antardasha resumes mid-sequence | On 1995-01-01 example: **Venus–Rahu** (was Venus–Mars); first shown bhukti **Venus–Moon** | Astrologer |
| 2 | First mahadasha display convention | Shown **from birth** with **balance** length (~15y), bhuktis resume at birth | Astrologer |
| 3 | Mangal dosha mitigation set | Mitigates on **own_sign / exalted / moolatrikona**; reduces affliction count by **1** | Astrologer |
| 4 | Other Mangal cancellations | Currently **none** beyond dignity — confirm if more are required | Astrologer |
| 5 | "Dhanishta" spelling + ratings | Spelling **"Dhanishta"**; haircut/travel = **avoid**; nature **+0.4** | Astrologer |
