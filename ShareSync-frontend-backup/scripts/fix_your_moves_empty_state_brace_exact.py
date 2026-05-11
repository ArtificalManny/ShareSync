from pathlib import Path

path = Path("src/components/focus/YourMovesToday.jsx")
text = path.read_text()

empty_marker = "function EmptyState({ onRefresh }) {"
export_marker = "\nexport function YourMovesWidget"

empty_start = text.find(empty_marker)

if empty_start == -1:
    raise SystemExit("Could not find EmptyState. No changes made.")

export_start = text.find(export_marker, empty_start)

if export_start == -1:
    raise SystemExit("Could not find YourMovesWidget export after EmptyState. No changes made.")

before_empty = text[:empty_start]
empty_block = text[empty_start:export_start]
after_export = text[export_start:]

trimmed = empty_block.rstrip()

if trimmed.endswith("\n}"):
    print("✅ EmptyState already has a closing brace. No changes needed.")
    raise SystemExit(0)

if not trimmed.endswith(");"):
    print("EmptyState block does not end with `);`, so I stopped before editing.")
    print("Tail preview:")
    print(trimmed[-500:])
    raise SystemExit("No changes made.")

fixed_empty_block = trimmed + "\n}\n"
fixed = before_empty + fixed_empty_block + after_export

# Safety checks
if fixed.count("function EmptyState({ onRefresh }) {") != 1:
    raise SystemExit("Safety check failed: expected exactly one EmptyState. No changes written.")

if fixed.count("export function YourMovesWidget") != 1:
    raise SystemExit("Safety check failed: expected exactly one YourMovesWidget export. No changes written.")

if fixed.count("export function FocusBanner") != 1:
    raise SystemExit("Safety check failed: expected exactly one FocusBanner export. No changes written.")

path.write_text(fixed)

print("✅ Added missing closing brace after EmptyState.")
print("✅ YourMovesWidget is now top-level again.")
print("✅ No backend touched.")
