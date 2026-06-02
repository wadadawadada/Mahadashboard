from __future__ import annotations

import json
from pathlib import Path


def validate(sources_path: Path, interpretations_path: Path) -> list[str]:
    source_ids: set[str] = set()
    with open(sources_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                obj = json.loads(line)
                source_ids.add(obj["id"])

    errors: list[str] = []
    with open(interpretations_path, encoding="utf-8") as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            obj = json.loads(line)
            sid = obj.get("source_id", "")
            if sid not in source_ids:
                errors.append(f"Line {line_num}: unknown source_id '{sid}' for key '{obj.get('key')}'")

    return errors
