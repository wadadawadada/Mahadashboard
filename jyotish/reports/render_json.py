from __future__ import annotations

import json
from pathlib import Path

from jyotish.schemas import ChartOutput


def render_chart_json(chart: ChartOutput, out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(chart.model_dump(), f, indent=2, ensure_ascii=False, default=str)


def render_context_json(context: dict, out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(context, f, indent=2, ensure_ascii=False)
