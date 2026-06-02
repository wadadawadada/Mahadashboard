from __future__ import annotations

from pathlib import Path

from jinja2 import Environment, FileSystemLoader

from jyotish.schemas import ChartOutput

_TEMPLATE_DIR = Path(__file__).parent / "templates"


def render_markdown(chart: ChartOutput, context: dict, out_path: Path) -> None:
    env = Environment(
        loader=FileSystemLoader(str(_TEMPLATE_DIR)),
        autoescape=False,
        keep_trailing_newline=True,
    )
    template = env.get_template("report.j2")

    context_map: dict[str, dict] = {item["key"]: item for item in context.get("items", [])}

    result = template.render(chart=chart, context=context, context_map=context_map)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(result, encoding="utf-8")
