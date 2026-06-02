"""Patch all existing context.json files using the updated interpretations database."""
import json
from pathlib import Path

ROOT = Path(__file__).parent.parent
INTERPS_PATH = ROOT / "data" / "knowledge" / "interpretations.jsonl"

from jyotish.knowledge.retrieve import load_interpretations, retrieve_context

interps = load_interpretations(INTERPS_PATH)
print(f"Loaded {len(interps)} interpretations")

ctx_files = list((ROOT / "data" / "reports").rglob("context.json"))
patched = 0
for ctx_path in ctx_files:
    chart_path = ctx_path.parent / "chart.json"
    if not chart_path.exists():
        continue
    chart = json.loads(chart_path.read_text(encoding="utf-8"))
    lang = chart.get("meta", {}).get("language", "ru")
    keys = chart.get("interpretation_keys", [])
    new_ctx = retrieve_context(keys, interps, language=lang)
    ctx_path.write_text(json.dumps(new_ctx, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"  {ctx_path}: found={len(new_ctx['items'])} missing={len(new_ctx['missing'])}")
    patched += 1

print(f"Patched {patched} context files")
