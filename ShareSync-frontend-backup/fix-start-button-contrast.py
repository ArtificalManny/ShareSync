from pathlib import Path
import shutil
from datetime import datetime

path = Path("src/features/stack/StackTaskRow.jsx")

if not path.exists():
    raise RuntimeError(
        "Could not find src/features/stack/StackTaskRow.jsx\n"
        "Run this to locate the Start button:\n"
        "grep -Rni \"Start working on this task\\|label: \\\"Start\\\"\" src | head -30"
    )

backup = path.with_suffix(
    path.suffix + f".backup-before-start-button-contrast-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)

text = path.read_text()

old_start = '''classes:
          "bg-violet-600 hover:bg-violet-700 text-white shadow-sm",'''

new_start = '''classes:
          "border border-violet-500 !bg-violet-600 !text-white shadow-[0_14px_30px_rgba(124,58,237,0.32)] ring-1 ring-violet-300/40 hover:!bg-violet-700 hover:border-violet-600 hover:shadow-[0_18px_40px_rgba(124,58,237,0.42)] dark:border-violet-400/40 dark:!bg-violet-500/15 dark:!text-violet-100 dark:ring-violet-400/10 dark:hover:!bg-violet-500/25",'''

old_review = '''classes:
          "bg-blue-600 hover:bg-blue-700 text-white shadow-sm",'''

new_review = '''classes:
          "border border-blue-500 !bg-blue-600 !text-white shadow-[0_14px_30px_rgba(37,99,235,0.26)] ring-1 ring-blue-300/30 hover:!bg-blue-700 hover:border-blue-600 dark:border-blue-400/40 dark:!bg-blue-500/15 dark:!text-blue-100 dark:ring-blue-400/10 dark:hover:!bg-blue-500/25",'''

old_button_class = '''className={`inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold px-3 py-2 rounded-lg
                    disabled:opacity-50 transition-colors flex-shrink-0 ${primaryAction.classes}`}'''

new_button_class = '''className={`inline-flex items-center justify-center gap-1.5 text-[11px] font-black px-4 py-2.5 rounded-xl
                    border transition-all duration-200 flex-shrink-0
                    disabled:cursor-not-allowed disabled:!opacity-100 disabled:saturate-100
                    ${primaryAction.classes}`}'''

changed = text

if old_start not in changed:
    raise RuntimeError(
        "Could not find the exact Start button class block.\n"
        "Run this and paste the output:\n"
        "grep -n -B 8 -A 16 \"Start working on this task\" src/features/stack/StackTaskRow.jsx"
    )

changed = changed.replace(old_start, new_start, 1)

if old_review in changed:
    changed = changed.replace(old_review, new_review, 1)

if old_button_class in changed:
    changed = changed.replace(old_button_class, new_button_class, 1)
else:
    print("Warning: Could not find exact shared button class block. Start color was still updated.")

if changed == text:
    raise RuntimeError("No changes made. Original file left untouched.")

shutil.copy2(path, backup)
path.write_text(changed)

print("✅ Updated Start button contrast.")
print(f"Backup saved at: {backup}")
print("")
print("Changed:")
print("- Start is now a strong violet CTA in light mode")
print("- Start stays cleaner/subtler in dark mode")
print("- Disabled Start button remains readable instead of disappearing")
print("- Review button received the same visibility treatment")
