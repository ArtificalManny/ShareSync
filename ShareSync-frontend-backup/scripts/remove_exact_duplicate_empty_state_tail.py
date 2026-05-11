from pathlib import Path

path = Path("src/components/focus/YourMovesToday.jsx")
text = path.read_text()

bad_start_marker = """
}) {
  return (
    <div className="py-10 text-center bg-teal-50/50 dark:bg-teal-500/5 rounded-xl border border-teal-100 dark:border-teal-500/10">
"""

keep_marker = """
export function YourMovesWidget({ onMoveClick, onViewAll }) {
"""

bad_start = text.find(bad_start_marker)
keep_start = text.find(keep_marker)

if bad_start == -1:
    raise SystemExit("Could not find malformed duplicate EmptyState tail starting with `}) {`. No changes made.")

if keep_start == -1:
    raise SystemExit("Could not find YourMovesWidget export. No changes made.")

if bad_start > keep_start:
    raise SystemExit("Malformed tail appears after YourMovesWidget, which is unexpected. No changes made.")

cleaned = text[:bad_start].rstrip() + "\n\n" + text[keep_start:].lstrip()

if "function EmptyState({ onRefresh })" not in cleaned:
    raise SystemExit("Safety check failed: EmptyState was removed. No changes written.")

if "Create Project" not in cleaned or "View Projects" not in cleaned or "Check Again" not in cleaned:
    raise SystemExit("Safety check failed: new EmptyState action buttons missing. No changes written.")

if cleaned.count("export function YourMovesWidget") != 1:
    raise SystemExit("Safety check failed: YourMovesWidget export count is not exactly 1. No changes written.")

if cleaned.count("export function FocusBanner") != 1:
    raise SystemExit("Safety check failed: FocusBanner export count is not exactly 1. No changes written.")

path.write_text(cleaned)

print("✅ Removed malformed duplicate EmptyState tail.")
print("✅ Preserved new EmptyState action buttons.")
print("✅ Preserved YourMovesWidget and FocusBanner.")
print("✅ No backend touched.")
