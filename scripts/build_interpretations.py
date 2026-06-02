"""
Rebuild data/knowledge/interpretations.jsonl from scratch.
Combines existing legacy entries (text-only) with new bilingual entries.
Run from project root: python scripts/build_interpretations.py
"""
import json, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).parent.parent
SCRIPTS = pathlib.Path(__file__).parent
INTERPS = ROOT / "data" / "knowledge" / "interpretations.jsonl"
PARTS = [
    SCRIPTS / "part1_planet_sign.jsonl",
    SCRIPTS / "part2_planet_house.jsonl",
    SCRIPTS / "part3_planet_nakshatra.jsonl",
    SCRIPTS / "part4_planet_nakshatra_pada.jsonl",
    SCRIPTS / "part5_lagna_d9_houses.jsonl",
    SCRIPTS / "part6_aspects_dashas.jsonl",
]

# 1. Generate each part
print("Generating parts...")
for script in [
    "gen_interps_part1.py",
    "gen_interps_part2.py",
    "gen_interps_part3.py",
    "gen_interps_part4.py",
    "gen_interps_part5.py",
    "gen_interps_part6.py",
]:
    result = subprocess.run([sys.executable, str(SCRIPTS / script)], capture_output=True, text=True)
    if result.returncode != 0:
        print(f"ERROR in {script}:\n{result.stderr}")
        sys.exit(1)
    print(f"  {result.stdout.strip()}")

# 2. Load legacy entries (have "text" field, no text_en/text_ru yet)
legacy = {}
if INTERPS.exists():
    with open(INTERPS, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            obj = json.loads(line)
            # Only keep if not already covered by new bilingual parts
            legacy[obj["key"]] = obj

# 3. Load all new bilingual entries
new_entries = {}
for part_file in PARTS:
    with open(part_file, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            obj = json.loads(line)
            new_entries[obj["key"]] = obj

# 4. Merge: new bilingual takes priority; legacy fills the rest
merged = {}
# Start with legacy
for key, obj in legacy.items():
    merged[key] = obj
# Overwrite/add with new bilingual entries
for key, obj in new_entries.items():
    merged[key] = obj

# 5. Write combined file
with open(INTERPS, "w", encoding="utf-8") as f:
    for obj in merged.values():
        f.write(json.dumps(obj, ensure_ascii=False) + "\n")

print(f"\nDone. Total entries in {INTERPS}: {len(merged)}")
print(f"  Legacy kept: {len(legacy)}")
print(f"  New/updated bilingual: {len(new_entries)}")
