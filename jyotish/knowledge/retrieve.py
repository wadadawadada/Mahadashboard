from __future__ import annotations

import json
from pathlib import Path

_MISSING_MSG = "No curated interpretation source found for this key."


def load_interpretations(jsonl_path: Path) -> dict[str, dict]:
    interps: dict[str, dict] = {}
    with open(jsonl_path, encoding="utf-8") as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
                interps[obj["key"]] = obj
            except (json.JSONDecodeError, KeyError) as e:
                raise ValueError(f"Invalid JSONL at line {line_num}: {e}")
    return interps


def retrieve_context(
    interpretation_keys: list[str],
    interpretations: dict[str, dict],
    chart_id: str = "latest",
    language: str = "ru",
) -> dict:
    seen: set[str] = set()
    items: list[dict] = []
    missing: list[dict] = []

    for key in interpretation_keys:
        if key in seen:
            continue
        seen.add(key)
        if key in interpretations:
            entry = interpretations[key]
            text_en = entry.get("text_en") or entry.get("text", "")
            text_ru = entry.get("text_ru") or text_en
            if language == "en":
                text = text_en
            else:
                text = text_ru
            items.append({
                "key": key,
                "source_id": entry["source_id"],
                "text": text,
                "text_ru": text_ru,
                "text_en": text_en,
            })
        else:
            missing.append({"key": key, "message": _MISSING_MSG})

    return {"chart_id": chart_id, "items": items, "missing": missing}
