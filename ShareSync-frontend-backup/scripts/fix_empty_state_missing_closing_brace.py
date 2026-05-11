from pathlib import Path
import re

path = Path("src/components/focus/YourMovesToday.jsx")
text = path.read_text()

empty_marker = "function EmptyState({ onRefresh }) {"
next_export_marker = "\nexport function YourMovesWidget"

empty_start = text.find(empty_marker)
next_export_start = text.find(next_export_marker, empty_start)

if empty_start == -1:
    raise SystemExit("Could not find EmptyState function. No changes made.")

if next_export_start == -1:
    raise SystemExit("Could not find YourMovesWidget export after EmptyState. No changes made.")

empty_block = text[empty_start:next_export_start]

if re.search(r"\n}\s*$", empty_block):
    print("✅ EmptyState already has a closing brace. No changes needed.")
    raise SystemExit(0)

if not empty_block.rstrip().endswith(");"):
    raise SystemExit("Safety check failed: EmptyState block does not end with `);`. No changes made.")

fixed = text[:next_export_start].rstrip() + "\n}\n\n" + text[next_export_start:].lstrip()

# Safety checks
fixed_empty_start = fixed.find(empty_marker)
fixed_export_start = fixed.find("export function YourMovesWidget", fixed_empty_start)
fixed_empty_block = fixed[fixed_empty_start:fixed_export_start]

if not re.search(r"\n}\s*$", fixed_empty_block):
    raise SystemExit("Safety check failed: EmptyState still does not close. No changes written.")

if fixed.count("function EmptyState({ onRefresh })") != 1:
    raise SystemExit("Safety check failed: EmptyState count is not exactly 1. No changes written.")

if fixed.count("export function YourMovesWidget") != 1:
    raise SystemExit("Safety check failed: YourMovesWidget export count is not exactly 1. No changes written.")

if fixed.count("export function FocusBanner") != 1:
    raise SystemExit("Safety check failed: FocusBanner export count is not exactly 1. No changes written.")

path.write_text(fixed)

print("✅ Added missing closing brace after EmptyState.")
print("✅ YourMovesWidget is now back at top level.")
print("✅ FocusBanner preserved.")
print("✅ No backend touched.")
