from __future__ import annotations

from datetime import datetime, timezone
from zoneinfo import ZoneInfo


def local_to_utc(birth_date: str, birth_time: str, timezone_str: str) -> datetime:
    year, month, day = (int(x) for x in birth_date.split("-"))
    hour, minute = (int(x) for x in birth_time.split(":"))
    local_dt = datetime(year, month, day, hour, minute, tzinfo=ZoneInfo(timezone_str))
    return local_dt.astimezone(timezone.utc)


def to_julian_day(utc_dt: datetime) -> float:
    import swisseph as swe
    hour_decimal = utc_dt.hour + utc_dt.minute / 60.0 + utc_dt.second / 3600.0
    return swe.julday(utc_dt.year, utc_dt.month, utc_dt.day, hour_decimal)
