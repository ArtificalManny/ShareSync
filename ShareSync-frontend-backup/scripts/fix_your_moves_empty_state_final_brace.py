from pathlib import Path

path = Path("src/components/focus/YourMovesToday.jsx")
text = path.read_text()

empty_marker = "function EmptyState({ onRefresh }) {"
next_export_marker = "export function YourMovesWidget"

empty_start = text.find(empty_marker)
if empty_start == -1:
    raise SystemExit("Could not find EmptyState function. No changes made.")

next_export_start = text.find(next_export_marker, empty_start)
if next_export_start == -1:
    raise SystemExit("Could not find YourMovesWidget export after EmptyState. No changes made.")

before_empty = text[:empty_start]
empty_block = text[empty_start:next_export_start]
after_export = text[next_export_start:]

# The broken shape is:
#   );
#
# export function YourMovesWidget...
#
# The correct shape is:
#   );
# }
#
# export function YourMovesWidget...
stripped_empty_block = empty_block.rstrip()

if stripped_empty_block.endswith(");"):
    fixed_empty_block = stripped_empty_block + "\n}\n\n"
elif stripped_empty_block.endswith("}"):
    print("✅ EmptyState already appears closed. No brace added.")
    fixed_empty_block = stripped_empty_block + "\n\n"
else:
    print("Could not safely identify the end of EmptyState.")
    print("EmptyState tail preview:")
    print(stripped_empty_block[-400:])
    raise SystemExit("No changes made.")

fixed = before_empty + fixed_empty_block + after_export

if "function EmptyState({ onRefresh }) {" not in fixed:
    raise SystemExit("Safety check failed: EmptyState missing after patch. No changes written.")

if "export function YourMovesWidget" not in fixed:
    raise SystemExit("Safety check failed: YourMovesWidget missing after patch. No changes written.")

if fixed.count("function EmptyState({ onRefresh }) {") != 1:
    raise SystemExit("Safety check failed: expected exactly one EmptyState function. No changes written.")

if fixed.count("export function YourMovesWidget") != 1:
    raise SystemExit("Safety check failed: expected exactly one YourMovesWidget export. No changes written.")

path.write_text(fixed)

print("✅ Added final closing brace after EmptyState if needed.")
print("✅ YourMovesWidget is now top-level.")
print("✅ No backend touched.")
