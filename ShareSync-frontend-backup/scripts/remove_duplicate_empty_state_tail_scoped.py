from pathlib import Path
import re

path = Path("src/components/focus/YourMovesToday.jsx")
text = path.read_text()

empty_marker = "function EmptyState({ onRefresh })"
empty_start = text.find(empty_marker)

if empty_start == -1:
    raise SystemExit("Could not find function EmptyState({ onRefresh }). No changes made.")

tail = text[empty_start:]

# The broken leftover begins after the new EmptyState with:
# }) {
#   return (
#
# This is ONLY invalid when it appears after EmptyState.
bad_pattern = re.compile(
    r"\n\}\)\s*\{\s*\n\s*return\s*\(",
    re.MULTILINE,
)

bad_match = bad_pattern.search(tail)

if not bad_match:
    print("Could not find duplicate malformed EmptyState tail after EmptyState.")
    print("Showing nearby code:")
    lines = text.splitlines()
    for i in range(250, min(len(lines), 340)):
        print(f"{i+1:04d}: {lines[i]}")
    raise SystemExit("No changes made.")

bad_abs_start = empty_start + bad_match.start()

removed_tail = text[bad_abs_start:]

# Safety check: if the section we are about to remove appears to contain
# another real top-level component/helper, stop instead of deleting too much.
dangerous_top_level = re.search(
    r"^\s*(export\s+|function\s+[A-Za-z_$]|const\s+[A-Za-z_$].*=|let\s+[A-Za-z_$].*=|var\s+[A-Za-z_$].*=)",
    removed_tail[10:],
    re.MULTILINE,
)

if dangerous_top_level:
    print("Stopped because the removable tail appears to contain another top-level declaration.")
    print("Showing removable tail preview:")
    print(removed_tail[:1200])
    raise SystemExit("No changes made.")

cleaned = text[:bad_abs_start].rstrip() + "\n"

# Safety checks after cleaning.
if cleaned.count(empty_marker) != 1:
    raise SystemExit("Safety check failed: expected exactly one EmptyState function. No changes written.")

cleaned_after_empty = cleaned[cleaned.find(empty_marker):]

if re.search(r"^\}\)\s*\{", cleaned_after_empty, re.MULTILINE):
    raise SystemExit("Safety check failed: malformed `}) {` still exists after EmptyState. No changes written.")

path.write_text(cleaned)

print("✅ Removed duplicate malformed EmptyState tail.")
print("✅ Kept the new action-button EmptyState.")
print("✅ Ignored the valid component `}) {` near the top of the file.")
print("✅ No backend touched.")
