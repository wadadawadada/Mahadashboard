import json
from datetime import date
from pathlib import Path

import pytest

PLACES = Path(__file__).parent.parent / "data" / "places" / "places.json"
INTERPS = Path(__file__).parent.parent / "data" / "knowledge" / "interpretations.jsonl"


def _make_birth():
    from jyotish.schemas import BirthInput
    return BirthInput(
        name="Test Person",
        birth_date="1979-07-15",
        birth_time="21:36",
        city="Moscow",
        country="Russia",
    )


def test_full_pipeline_creates_files(tmp_path):
    from jyotish.engine.calculator import calculate_chart
    from jyotish.knowledge.retrieve import load_interpretations, retrieve_context
    from jyotish.reports.render_json import render_chart_json, render_context_json
    from jyotish.reports.render_markdown import render_markdown

    birth = _make_birth()
    chart = calculate_chart(birth, places_path=PLACES, today=date(2025, 1, 1))

    interps = load_interpretations(INTERPS)
    context = retrieve_context(chart.interpretation_keys, interps)

    out_json = tmp_path / "chart.json"
    out_ctx = tmp_path / "context.json"
    out_md = tmp_path / "report.md"

    render_chart_json(chart, out_json)
    render_context_json(context, out_ctx)
    render_markdown(chart, context, out_md)

    assert out_json.exists()
    assert out_ctx.exists()
    assert out_md.exists()


def test_chart_json_structure(tmp_path):
    from jyotish.engine.calculator import calculate_chart
    from jyotish.reports.render_json import render_chart_json

    birth = _make_birth()
    chart = calculate_chart(birth, places_path=PLACES, today=date(2025, 1, 1))
    out = tmp_path / "chart.json"
    render_chart_json(chart, out)

    data = json.loads(out.read_text())
    assert "lagna" in data
    assert "planets" in data
    assert "houses" in data
    assert "dashas" in data
    assert "aspects" in data
    assert len(data["planets"]) == 9  # 9 planets including Rahu/Ketu


def test_report_contains_required_sections(tmp_path):
    from jyotish.engine.calculator import calculate_chart
    from jyotish.knowledge.retrieve import load_interpretations, retrieve_context
    from jyotish.reports.render_markdown import render_markdown

    birth = _make_birth()
    chart = calculate_chart(birth, places_path=PLACES, today=date(2025, 1, 1))
    interps = load_interpretations(INTERPS)
    context = retrieve_context(chart.interpretation_keys, interps)

    out_md = tmp_path / "report.md"
    render_markdown(chart, context, out_md)
    text = out_md.read_text(encoding="utf-8")

    assert "Лагна" in text
    assert "Vimshottari" in text or "Виманшоттари" in text or "Маха-даша" in text
    assert "Таблица планет" in text
    assert "ID источников" in text or "Источник интерпретации не найден" in text


def test_context_has_items_and_missing(tmp_path):
    from jyotish.engine.calculator import calculate_chart
    from jyotish.knowledge.retrieve import load_interpretations, retrieve_context

    birth = _make_birth()
    chart = calculate_chart(birth, places_path=PLACES, today=date(2025, 1, 1))
    interps = load_interpretations(INTERPS)
    context = retrieve_context(chart.interpretation_keys, interps)

    assert "items" in context
    assert "missing" in context
    assert len(context["items"]) > 0


def test_lagna_has_sign(tmp_path):
    from jyotish.engine.calculator import calculate_chart

    birth = _make_birth()
    chart = calculate_chart(birth, places_path=PLACES, today=date(2025, 1, 1))
    assert chart.lagna.sign in [
        "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
        "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
    ]


def test_d9_navamsa_present():
    from jyotish.engine.calculator import calculate_chart

    birth = _make_birth()
    chart = calculate_chart(birth, places_path=PLACES, today=date(2025, 1, 1))
    d9 = chart.divisional_charts.get("D9", {})
    assert "planets" in d9
    assert len(d9["planets"]) == 9
