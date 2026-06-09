from __future__ import annotations

import json
import re
import shutil
from datetime import date, datetime, timezone
from pathlib import Path

import typer
from rich.console import Console

app = typer.Typer(
    help="Jyotish — детерминированный расчёт карты рождения.",
    invoke_without_command=False,
    no_args_is_help=True,
    add_completion=False,
)
console = Console()

_PLACES = Path(__file__).parent.parent / "data" / "places" / "places.json"
_INTERPS = Path(__file__).parent.parent / "data" / "knowledge" / "interpretations.jsonl"


@app.command()
def report(
    input: Path = typer.Option(..., help="Путь к birth.json"),
    out_json: Path = typer.Option(..., help="Выходной JSON карты"),
    out_context: Path = typer.Option(..., help="Выходной JSON контекста"),
    out_md: Path = typer.Option(..., help="Выходной Markdown отчёт"),
    language: str = typer.Option("ru", help="Язык трактовок: ru или en"),
):
    """Сгенерировать отчёт по карте Джйотиш."""
    from jyotish.engine.calculator import calculate_chart
    from jyotish.knowledge.retrieve import load_interpretations, retrieve_context
    from jyotish.reports.render_json import render_chart_json, render_context_json
    from jyotish.reports.render_markdown import render_markdown
    from jyotish.schemas import BirthInput

    console.print("[bold cyan]Jyotish Agent[/bold cyan] — расчёт карты...")

    try:
        raw = json.loads(input.read_text(encoding="utf-8"))
        birth = BirthInput.model_validate(raw)
    except Exception as e:
        console.print(f"[red]Ошибка чтения birth.json:[/red] {e}")
        raise typer.Exit(1)

    try:
        chart = calculate_chart(birth, places_path=_PLACES, today=date.today())
    except ValueError as e:
        console.print(f"[red]Ошибка расчёта:[/red] {e}")
        raise typer.Exit(1)

    interps = load_interpretations(_INTERPS)
    context = retrieve_context(chart.interpretation_keys, interps, language=language)

    # Build named run folder: data/reports/{slug}_{YYYY-MM-DD}_{HHMM}/
    slug = re.sub(r"[^\w]+", "_", (birth.name or "chart").strip()).strip("_").lower()
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d_%H%M")
    run_dir = out_json.parent / f"{slug}_{ts}"
    run_dir.mkdir(parents=True, exist_ok=True)

    run_json = run_dir / "chart.json"
    run_ctx = run_dir / "context.json"
    run_md = run_dir / "report.md"

    render_chart_json(chart, run_json)
    render_context_json(context, run_ctx)
    render_markdown(chart, context, run_md)

    # Copy to latest.* in parent folder
    shutil.copy2(run_json, out_json)
    shutil.copy2(run_ctx, out_context)
    shutil.copy2(run_md, out_md)

    found = len(context["items"])
    missing = len(context["missing"])
    current = chart.dashas.current

    console.print("\n[green]Сгенерировано:[/green]")
    console.print(f"  Папка:    {run_dir}")
    console.print(f"  JSON:     {run_json}")
    console.print(f"  Контекст: {run_ctx}")
    console.print(f"  Markdown: {run_md}")
    console.print(f"  latest-> {out_json.parent}")
    console.print("\n[bold]Сводка:[/bold]")
    console.print(f"  Лагна: {chart.lagna.sign}, {chart.lagna.nakshatra} Пада {chart.lagna.pada}")
    moon = chart.planets.get("moon")
    if moon:
        console.print(f"  Луна: {moon.sign}, {moon.nakshatra} Пада {moon.pada}, Дом {moon.house}")
    console.print(f"  Текущий период Vimshottari: {current.mahadasha} / {current.antardasha}")
    console.print(f"  Интерпретаций найдено: {found}, отсутствует: {missing}")
    if chart.warnings:
        for w in chart.warnings:
            console.print(f"  [yellow]Предупреждение:[/yellow] {w}")


@app.command()
def geo(
    input: Path = typer.Option(..., help="Путь к birth.json"),
    out_geo: Path = typer.Option(..., help="Выходной JSON астрокартографии"),
    language: str = typer.Option("ru", help="Язык: ru или en"),
):
    """Рассчитать астрокартографические линии для карты."""
    from jyotish.engine.astrocartography import compute_acg_lines
    from jyotish.schemas import BirthInput

    try:
        raw = json.loads(input.read_text(encoding="utf-8"))
        birth = BirthInput.model_validate(raw)
    except Exception as e:
        console.print(f"[red]Ошибка чтения birth.json:[/red] {e}")
        raise typer.Exit(1)

    # Compute Julian Day from birth data
    try:
        from jyotish.engine.calculator import calculate_chart

        chart = calculate_chart(birth, places_path=_PLACES, today=date.today())
        jd = chart.birth.julian_day
    except Exception as e:
        console.print(f"[red]Ошибка расчёта JD:[/red] {e}")
        raise typer.Exit(1)

    console.print(f"[cyan]ACG: JD={jd:.4f}[/cyan]")

    try:
        result = compute_acg_lines(jd, language=language)
    except Exception as e:
        console.print(f"[red]Ошибка ACG:[/red] {e}")
        raise typer.Exit(1)

    out_geo.parent.mkdir(parents=True, exist_ok=True)
    out_geo.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")

    console.print(f"[green]Линий:[/green] {len(result['lines'])}, паранов: {len(result['parans'])}")
    console.print(f"[green]Файл:[/green] {out_geo}")


@app.command()
def forecast(
    input: Path = typer.Option(..., help="Путь к birth.json"),
    out_forecast: Path = typer.Option(..., help="Выходной JSON прогноза"),
    forecast_date: str = typer.Option(None, help="Дата прогноза YYYY-MM-DD (по умолчанию сегодня)"),
    language: str = typer.Option("ru", help="Язык: ru или en"),
    score_method: str = typer.Option("mix", help="Метод скоринга: mix или jyotish"),
):
    """Рассчитать транзитный прогноз на заданную дату."""
    from datetime import date as date_type
    from jyotish.engine.calculator import calculate_chart
    from jyotish.engine.transits import calculate_forecast
    from jyotish.knowledge.retrieve import load_interpretations, retrieve_context
    from jyotish.schemas import BirthInput

    try:
        raw = json.loads(input.read_text(encoding="utf-8"))
        birth = BirthInput.model_validate(raw)
    except Exception as e:
        console.print(f"[red]Ошибка чтения birth.json:[/red] {e}")
        raise typer.Exit(1)

    if forecast_date:
        try:
            y, m, d = forecast_date.split("-")
            target_date = date_type(int(y), int(m), int(d))
        except ValueError:
            console.print(f"[red]Неверный формат даты:[/red] {forecast_date}. Используйте YYYY-MM-DD.")
            raise typer.Exit(1)
    else:
        target_date = date_type.today()

    try:
        natal_chart = calculate_chart(birth, places_path=_PLACES, today=target_date)
    except ValueError as e:
        console.print(f"[red]Ошибка расчёта натальной карты:[/red] {e}")
        raise typer.Exit(1)

    try:
        forecast_data = calculate_forecast(natal_chart, target_date, language=language, score_method=score_method)
    except Exception as e:
        console.print(f"[red]Ошибка расчёта прогноза:[/red] {e}")
        raise typer.Exit(1)

    # Retrieve interpretation texts for transit keys (fall back to natal keys)
    interps = load_interpretations(_INTERPS)
    context = retrieve_context(forecast_data["interp_keys"], interps, language=language)
    forecast_data["context"] = context

    out_forecast.parent.mkdir(parents=True, exist_ok=True)
    out_forecast.write_text(
        json.dumps(forecast_data, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    console.print(f"[green]Прогноз на {target_date}:[/green] счёт {forecast_data['score']}/100")
    console.print(f"  Даша: {forecast_data['active_dasha']['mahadasha']} / "
                  f"{forecast_data['active_dasha']['antardasha']}")
    console.print(f"[green]Файл:[/green] {out_forecast}")


if __name__ == "__main__":
    app()
