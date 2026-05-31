from pathlib import Path
import shutil
from datetime import datetime
import re

path = Path("src/features/stack/StackTaskRow.jsx")

if not path.exists():
    raise RuntimeError(f"Missing file: {path}")

original = path.read_text()
text = original

backup = path.with_suffix(
    path.suffix + f".backup-before-start-button-contrast-v2-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
shutil.copy2(path, backup)

def fail(message):
    path.write_text(original)
    raise RuntimeError(message + f"\nOriginal restored. Backup kept at: {backup}")

def replace_action_classes_by_title(source, title, new_classes):
    title_index = source.find(f'title: "{title}"')
    if title_index == -1:
        fail(
            f'Could not find action title: {title}\n'
            "Run this and paste the output:\n"
            "grep -n -B 15 -A 25 \"Start working on this task\\|Move to review\\|primaryAction\" src/features/stack/StackTaskRow.jsx"
        )

    # Find the nearest object-ish window around this action.
    window_start = max(0, source.rfind("{", 0, title_index) - 300)
    window_end = min(len(source), title_index + 700)
    window = source[window_start:window_end]

    match = re.search(r'classes:\s*"[^"]*"', window)
    if not match:
        fail(
            f'Found "{title}", but could not find its classes string.\n'
            "Run this and paste the output:\n"
            f"grep -n -B 20 -A 35 \"{title}\" src/features/stack/StackTaskRow.jsx"
        )

    replacement = f'classes:\n          "{new_classes}"'

    return (
        source[:window_start + match.start()]
        + replacement
        + source[window_start + match.end():]
    )

start_classes = (
    "bg-violet-700 hover:bg-violet-800 text-white "
    "border border-violet-500/80 "
    "shadow-[0_14px_32px_rgba(124,58,237,0.36)] "
    "ring-1 ring-violet-200/70 "
    "disabled:!opacity-100 disabled:!bg-violet-700 disabled:!text-white disabled:!border-violet-500 disabled:!shadow-[0_10px_24px_rgba(124,58,237,0.24)] "
    "dark:bg-violet-500 dark:hover:bg-violet-400 dark:text-white dark:border-violet-300/40 dark:ring-violet-300/10 "
    "dark:disabled:!bg-violet-500/25 dark:disabled:!text-violet-100 dark:disabled:!border-violet-300/30"
)

review_classes = (
    "bg-sky-600 hover:bg-sky-700 text-white "
    "border border-sky-500/80 "
    "shadow-[0_12px_28px_rgba(2,132,199,0.30)] "
    "ring-1 ring-sky-200/60 "
    "disabled:!opacity-100 disabled:!bg-sky-600 disabled:!text-white disabled:!border-sky-500 "
    "dark:bg-blue-500 dark:hover:bg-blue-400 dark:text-white dark:border-blue-300/40 "
    "dark:disabled:!bg-blue-500/25 dark:disabled:!text-blue-100 dark:disabled:!border-blue-300/30"
)

text = replace_action_classes_by_title(text, "Start working on this task", start_classes)

if 'title: "Move to review"' in text:
    text = replace_action_classes_by_title(text, "Move to review", review_classes)

if text == original:
    fail("No changes were made.")

required = [
    "Start working on this task",
    "bg-violet-700",
    "disabled:!opacity-100",
    "onStart?.(task)",
]

missing = [item for item in required if item not in text]
if missing:
    fail(f"Safety check failed. Missing: {missing}")

path.write_text(text)

print("✅ Moves Start button contrast v2 applied successfully.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed:")
print("- Start button now has stronger violet contrast in light mode")
print("- Disabled Start button should stay readable instead of fading out")
print("- Review button improved too, if present")
print("")
print("Kept intact:")
print("- onStart logic")
print("- onMoveToReview logic")
print("- onComplete logic")
print("- StackPanel / ProjectHome structure")
