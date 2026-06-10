from __future__ import annotations

from typing import Optional
from pydantic import BaseModel


class JyotishSettings(BaseModel):
    ayanamsa: str = "lahiri"
    zodiac: str = "sidereal"
    house_system: str = "whole_sign"
    dasha_system: str = "vimshottari_from_moon"
    include_navamsa: bool = True
    include_aspects: bool = True
    include_interpretation: bool = True
    include_clickable_keys: bool = True
    enable_node_aspects: bool = False


class BirthInput(BaseModel):
    name: Optional[str] = None
    birth_date: str
    birth_time: str
    city: str
    country: str
    language: str = "ru"
    settings: JyotishSettings = JyotishSettings()


class ResolvedLocation(BaseModel):
    city_key: str
    display_name: str
    latitude: float
    longitude: float
    timezone: str


class PlanetData(BaseModel):
    name: str
    key: str
    longitude_sidereal: float
    sign: str
    sign_degree: float
    degree_formatted: str
    house: int
    nakshatra: str
    pada: int
    retrograde: bool
    ruler_of_houses: list[int]
    dignity: str
    clickable_keys: list[str]


class LagnaData(BaseModel):
    sign: str
    degree: float
    degree_formatted: str
    nakshatra: str
    pada: int
    clickable_keys: list[str]


class HouseData(BaseModel):
    number: int
    sign: str
    lord: str
    planets: list[str]
    clickable_keys: list[str]


class AspectData(BaseModel):
    from_planet: str
    from_house: int
    aspect: str
    to_house: int
    to_sign: str
    clickable_key: str


class MahadashaEntry(BaseModel):
    planet: str
    start: str
    end: str
    duration_years: int
    clickable_key: str


class AntardashaEntry(BaseModel):
    mahadasha: str
    antardasha: str
    start: str
    end: str
    clickable_key: str


class PratyantardashaEntry(BaseModel):
    mahadasha: str
    antardasha: str
    pratyantardasha: str
    start: str
    end: str
    clickable_key: str


class CurrentDasha(BaseModel):
    mahadasha: str
    antardasha: str
    pratyantardasha: Optional[str] = None


class DashaData(BaseModel):
    system: str
    seed: str
    birth_moon_nakshatra: str
    birth_mahadasha: str
    balance_days: float
    current: CurrentDasha
    mahadashas: list[MahadashaEntry]
    antardashas: list[AntardashaEntry]
    pratyantardashas: list[PratyantardashaEntry]


class NavamsaPlanet(BaseModel):
    sign: str
    clickable_key: str


class AshtakavargaData(BaseModel):
    bav: dict[str, list[int]]   # planet → 12 house scores
    sav: list[int]              # Sarvashtakavarga (12 house totals)
    planet_totals: dict[str, int]  # planet → total strength


class ChartMeta(BaseModel):
    engine: str = "swiss_ephemeris"
    zodiac: str
    ayanamsa: str
    house_system: str
    dasha_system: str
    language: str
    calculated_at: str


class BirthData(BaseModel):
    name: Optional[str]
    local_date: str
    local_time: str
    city: str
    country: str
    latitude: float
    longitude: float
    timezone: str
    utc_datetime: str
    julian_day: float


class ChartOutput(BaseModel):
    meta: ChartMeta
    birth: BirthData
    lagna: LagnaData
    planets: dict[str, PlanetData]
    houses: dict[str, HouseData]
    aspects: list[AspectData]
    dashas: DashaData
    divisional_charts: dict[str, dict]
    ashtakavarga: Optional[AshtakavargaData] = None
    interpretation_keys: list[str]
    warnings: list[str]
