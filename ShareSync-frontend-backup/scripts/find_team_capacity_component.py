from pathlib import Path
import re

path = Path("src/pages/ProjectHome.jsx")
text = path.read_text()

needle = "Team Capacity"
idx = text.find(needle)

if idx == -1:
    raise SystemExit("❌ Could not find visible text: Team Capacity")

before = text[:idx]

matches = list(re.finditer(
    r"(function\s+([A-Za-z0-9_]+)\s*\([^)]*\)\s*\{)",
    before
))

if not matches:
    raise SystemExit("❌ Found Team Capacity text, but could not find the containing function.")

match = matches[-1]
fn_name = match.group(2)
fn_start = match.start()

print(f"✅ Team Capacity appears inside function: {fn_name}")
print(f"✅ Function starts around character index: {fn_start}")
print("")
print("Inspect this exact component:")
print(f'rg -n "function {fn_name}|Team Capacity|ProjectActiveGoalsCard" src/pages/ProjectHome.jsx -C 35')
