from pathlib import Path
from datetime import datetime
import shutil

path = Path("src/features/stack/StackTaskRow.jsx")

if not path.exists():
    raise RuntimeError("Could not find src/features/stack/StackTaskRow.jsx")

text = path.read_text()
original = text

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = path.with_name(path.name + f".backup-before-direct-start-visible-{stamp}")
shutil.copy2(path, backup)

old_start_classes = '''"stack-start-action bg-violet-600 hover:bg-violet-700 text-white shadow-sm",'''

new_start_classes = '''"stack-start-action !bg-violet-700 hover:!bg-violet-800 !text-white border border-violet-500/80 shadow-[0_14px_34px_rgba(124,58,237,0.38)] ring-1 ring-violet-200/70 disabled:!opacity-100 disabled:!bg-violet-700 disabled:!text-white disabled:!border-violet-500 disabled:cursor-not-allowed dark:!bg-violet-500 dark:hover:!bg-violet-400 dark:!text-white",'''

if old_start_classes not in text:
    raise RuntimeError(
        "Could not find the Start classes block. Run:\n"
        "grep -n -B 10 -A 15 \"stack-start-action\" src/features/stack/StackTaskRow.jsx"
    )

text = text.replace(old_start_classes, new_start_classes, 1)

old_button_class = '''className={`stack-task-action inline-flex items-center justify-center gap-1.5 text-[11px] font-black px-3 py-2 rounded-lg
                    disabled:opacity-50 transition-colors flex-shrink-0 ${primaryAction.classes}`}'''

new_button_class = '''className={`stack-task-action inline-flex items-center justify-center gap-1.5 text-[11px] font-black px-4 py-2 rounded-xl
                    disabled:!opacity-100 transition-all flex-shrink-0 ${primaryAction.classes}`}'''

if old_button_class not in text:
    raise RuntimeError(
        "Could not find the shared primary action button class. Run:\n"
        "grep -n -B 8 -A 12 \"stack-task-action\" src/features/stack/StackTaskRow.jsx"
    )

text = text.replace(old_button_class, new_button_class, 1)

old_row_fade = '''${disabled && !completing ? "opacity-60" : ""}'''

new_row_fade = '''${disabled && !completing ? "opacity-100" : ""}'''

if old_row_fade not in text:
    raise RuntimeError(
        "Could not find the row opacity fade. Run:\n"
        "grep -n -B 4 -A 4 \"opacity-60\" src/features/stack/StackTaskRow.jsx"
    )

text = text.replace(old_row_fade, new_row_fade, 1)

path.write_text(text)

print("✅ Direct Moves Start button visibility fix applied.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed:")
print("- Start button now uses a stronger violet CTA style")
print("- Disabled Start button no longer fades into the white background")
print("- The whole task row no longer fades and hides the button")
print("- Start logic is untouched")
