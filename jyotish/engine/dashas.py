from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional

from jyotish.engine.nakshatra import (
    NAKSHATRA_SPAN,
    NAKSHATRAS,
    get_nakshatra,
    get_nakshatra_index,
)
from jyotish.schemas import (
    AntardashaEntry,
    CurrentDasha,
    DashaData,
    MahadashaEntry,
    PratyantardashaEntry,
)

DASHA_ORDER = ["ketu", "venus", "sun", "moon", "mars", "rahu", "jupiter", "saturn", "mercury"]

DASHA_YEARS: dict[str, int] = {
    "ketu": 7,
    "venus": 20,
    "sun": 6,
    "moon": 10,
    "mars": 7,
    "rahu": 18,
    "jupiter": 16,
    "saturn": 19,
    "mercury": 17,
}

YEAR_DAYS = 365.25

NAKSHATRA_TO_DASHA: dict[str, str] = {
    nk: DASHA_ORDER[i % 9] for i, nk in enumerate(NAKSHATRAS)
}


def _years_to_td(years: float) -> timedelta:
    return timedelta(days=years * YEAR_DAYS)


def _dt_to_iso(dt: datetime) -> str:
    return dt.isoformat()


def calculate_dashas(
    birth_utc: datetime,
    moon_longitude: float,
    today: object,
) -> DashaData:
    moon_nakshatra = get_nakshatra(moon_longitude)
    birth_dasha_lord = NAKSHATRA_TO_DASHA[moon_nakshatra]

    nakshatra_start_lon = get_nakshatra_index(moon_nakshatra) * NAKSHATRA_SPAN
    fraction_traversed = (moon_longitude % 360.0 - nakshatra_start_lon) / NAKSHATRA_SPAN
    fraction_traversed = max(0.0, min(fraction_traversed, 1.0))
    remaining_fraction = 1.0 - fraction_traversed
    balance_years = remaining_fraction * DASHA_YEARS[birth_dasha_lord]
    balance_days = balance_years * YEAR_DAYS

    elapsed_first_years = fraction_traversed * DASHA_YEARS[birth_dasha_lord]

    start_idx = DASHA_ORDER.index(birth_dasha_lord)
    mahadashas: list[MahadashaEntry] = []
    antardashas: list[AntardashaEntry] = []
    pratyantardashas: list[PratyantardashaEntry] = []

    current_start = birth_utc

    for i in range(9):
        lord_idx = (start_idx + i) % 9
        lord = DASHA_ORDER[lord_idx]
        full_maha_years = DASHA_YEARS[lord]

        # The first mahadasha is only partially remaining at birth: only the
        # balance is shown. Its antardashas/pratyantardashas must therefore
        # *resume mid-sequence* from the sub-period running at birth rather than
        # restarting from the mahadasha lord's first sub-period. We model this by
        # computing the sub-period tree from the mahadasha's true ("notional")
        # start — which precedes birth by the elapsed portion — and omitting any
        # sub-period that has already finished before birth; the sub-period
        # straddling birth is clipped to start at birth. Later mahadashas start
        # in the future, so the same clip-at-birth logic leaves them unchanged.
        if i == 0:
            notional_start = birth_utc - _years_to_td(elapsed_first_years)
        else:
            notional_start = current_start
        # The mahadasha always spans its full length from the notional start; the
        # displayed (balance) span is what remains from birth. Deriving maha_end
        # from the notional start keeps it consistent with the sub-period tiling.
        maha_end = notional_start + _years_to_td(full_maha_years)
        span_years = round((maha_end - current_start).total_seconds() / 86400 / YEAR_DAYS, 2)

        mahadashas.append(MahadashaEntry(
            planet=lord.capitalize(),
            start=_dt_to_iso(current_start),
            end=_dt_to_iso(maha_end),
            duration_years=span_years,
            clickable_key=f"dasha:{lord}:mahadasha",
        ))

        _build_subperiods(
            lord_idx, lord, full_maha_years, notional_start, birth_utc,
            antardashas, pratyantardashas,
        )

        current_start = maha_end

    current_maha, current_antar, current_pratya = _find_current(
        mahadashas, antardashas, pratyantardashas, today
    )

    return DashaData(
        system="Vimshottari",
        seed="Moon nakshatra",
        birth_moon_nakshatra=moon_nakshatra,
        birth_mahadasha=birth_dasha_lord.capitalize(),
        balance_days=round(balance_days, 2),
        current=CurrentDasha(
            mahadasha=current_maha,
            antardasha=current_antar,
            pratyantardasha=current_pratya,
        ),
        mahadashas=mahadashas,
        antardashas=antardashas,
        pratyantardashas=pratyantardashas,
    )


def _build_subperiods(
    maha_lord_idx: int,
    maha_lord: str,
    full_maha_years: float,
    notional_start: datetime,
    birth_utc: datetime,
    antardashas: list[AntardashaEntry],
    pratyantardashas: list[PratyantardashaEntry],
) -> None:
    """Append the antardasha + pratyantardasha entries for one mahadasha.

    ``notional_start`` is the mahadasha's true start. For every mahadasha except
    the first it equals the displayed start (>= birth), so nothing is clipped and
    all nine antardashas are emitted from the mahadasha lord. For the first
    mahadasha it precedes birth, so sub-periods that finish before birth are
    skipped and the one running at birth is clipped to start at ``birth_utc`` —
    i.e. the sequence resumes mid-stream (Vimshottari balance rule).
    """
    maha_name = maha_lord.capitalize()

    antar_start = notional_start
    for j in range(9):
        antar_lord_idx = (maha_lord_idx + j) % 9
        antar_lord = DASHA_ORDER[antar_lord_idx]
        antar_years = (DASHA_YEARS[antar_lord] / 120.0) * full_maha_years
        antar_end = antar_start + _years_to_td(antar_years)

        if antar_end > birth_utc:
            antar_display_start = max(antar_start, birth_utc)
            antardashas.append(AntardashaEntry(
                mahadasha=maha_name,
                antardasha=antar_lord.capitalize(),
                start=_dt_to_iso(antar_display_start),
                end=_dt_to_iso(antar_end),
                clickable_key=f"dasha:{maha_lord}:{antar_lord}",
            ))

            pratya_start = antar_start
            for k in range(9):
                pratya_lord_idx = (antar_lord_idx + k) % 9
                pratya_lord = DASHA_ORDER[pratya_lord_idx]
                pratya_years = (DASHA_YEARS[pratya_lord] / 120.0) * antar_years
                pratya_end = pratya_start + _years_to_td(pratya_years)

                if pratya_end > birth_utc:
                    pratya_display_start = max(pratya_start, birth_utc)
                    pratyantardashas.append(PratyantardashaEntry(
                        mahadasha=maha_name,
                        antardasha=antar_lord.capitalize(),
                        pratyantardasha=pratya_lord.capitalize(),
                        start=_dt_to_iso(pratya_display_start),
                        end=_dt_to_iso(pratya_end),
                        clickable_key=f"dasha:{maha_lord}:{antar_lord}:{pratya_lord}",
                    ))
                pratya_start = pratya_end

        antar_start = antar_end


def _find_current(
    mahadashas: list[MahadashaEntry],
    antardashas: list[AntardashaEntry],
    pratyantardashas: list[PratyantardashaEntry],
    today: object,
) -> tuple[str, str, Optional[str]]:
    from datetime import date as date_type

    if isinstance(today, date_type):
        today_dt = datetime(today.year, today.month, today.day, tzinfo=timezone.utc)
    else:
        today_dt = today

    current_maha = mahadashas[-1].planet
    for m in mahadashas:
        m_start = datetime.fromisoformat(m.start)
        m_end = datetime.fromisoformat(m.end)
        if m_start <= today_dt < m_end:
            current_maha = m.planet
            break

    current_antar = ""
    for a in antardashas:
        if a.mahadasha != current_maha:
            continue
        a_start = datetime.fromisoformat(a.start)
        a_end = datetime.fromisoformat(a.end)
        if a_start <= today_dt < a_end:
            current_antar = a.antardasha
            break

    current_pratya: Optional[str] = None
    for p in pratyantardashas:
        if p.mahadasha != current_maha or p.antardasha != current_antar:
            continue
        p_start = datetime.fromisoformat(p.start)
        p_end = datetime.fromisoformat(p.end)
        if p_start <= today_dt < p_end:
            current_pratya = p.pratyantardasha
            break

    return current_maha, current_antar, current_pratya
