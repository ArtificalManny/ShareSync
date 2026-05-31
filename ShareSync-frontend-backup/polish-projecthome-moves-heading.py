from pathlib import Path
import shutil
from datetime import datetime

path = Path("src/pages/ProjectHome.jsx")

if not path.exists():
    raise RuntimeError(f"Could not find {path}")

text = path.read_text()
original = text

timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = Path(f"{path}.backup-moves-heading-{timestamp}")

replacements = [
    (
        "Top tasks to do next",
        "Moves",
    ),
    (
        "1 task ready across this project",
        "Execution queue for the next visible work",
    ),
    (
        "tasks ready across this project",
        "moves ready across this project",
    ),
    (
        "task ready across this project",
        "move ready across this project",
    ),
]

changed = []

for old, new in replacements:
    if old in text:
        text = text.replace(old, new)
        changed.append(f"{old} -> {new}")

if text == original:
    raise RuntimeError(
        "No matching Moves heading text found. No changes written.\n"
        "Run this and paste the output:\n"
        "grep -n -B 20 -A 50 \"Top tasks to do next\\|task ready across this project\\|Add Task\" src/pages/ProjectHome.jsx"
    )

# Safety checks: do not touch Files or Announcements labels/routes.
for protected in ['label: "Files"', 'label: "Announcements"', 'case "files"', 'case "announcements"']:
    if protected in original and protected not in text:
        raise RuntimeError(f"Unsafe result: protected text disappeared: {protected}. No changes written.")

shutil.copy2(path, backup)
path.write_text(text)

print("ProjectHome Moves heading polish applied successfully.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed:")
for item in changed:
    print(f"- {item}")
print("")
print("Kept intact:")
print("- Files")
print("- Announcements")
print("- Existing routes")
print("- Backend/API logic")
