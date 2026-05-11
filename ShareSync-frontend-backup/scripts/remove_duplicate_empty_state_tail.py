from pathlib import Path
import re

path = Path("src/components/focus/YourMovesToday.jsx")
text = path.read_text()

marker = "function EmptyState({ onRefresh })"
first_start = text.find(marker)

if first_start == -1:
    raise SystemExit("Could not find the real EmptyState function. No changes made.")

search_area = text[first_start:]

# This removes the malformed duplicate old EmptyState body that starts with:
# }) {
#   return (
#
# It does NOT touch the correct function EmptyState above it.
pattern = re.compile(
    r"\n\}\)\s*\{\s*\n\s*return\s*\(\s*\n"
    r"\s*<div className=\"py-10 text-center[\s\S]*?"
    r"\n\s*\);\s*\n\}\s*",
    re.MULTILINE,
)

match = pattern.search(search_area)

if not match:
    print("Could not find the malformed duplicate EmptyState tail.")
    print("Showing nearby code for manual inspection:")
    lines = text.splitlines()
    for i in range(250, min(len(lines), 345)):
        print(f"{i+1:04d}: {lines[i]}")
    raise SystemExit("No changes made.")

abs_start = first_start + match.start()
abs_end = first_start + match.end()

cleaned = text[:abs_start] + "\n" + text[abs_end:]

# Safety checks
if cleaned.count("function EmptyState({ onRefresh })") != 1:
    raise SystemExit("Safety check failed: expected exactly one EmptyState function. No changes written.")

if re.search(r"^\}\)\s*\{", cleaned, re.MULTILINE):
    raise SystemExit("Safety check failed: malformed `}) {` still exists. No changes written.")

path.write_text(cleaned)

print("✅ Removed duplicate malformed EmptyState tail.")
print("✅ Kept the new action-button EmptyState.")
print("✅ No backend touched.")
