from pathlib import Path
from datetime import datetime
import shutil

path = Path("src/features/stack/StackTaskRow.jsx")
text = path.read_text()

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = path.with_name(path.name + f".backup-before-start-button-contrast-v3-{stamp}")
shutil.copy2(path, backup)

old_start = '''"stack-start-action bg-violet-600 hover:bg-violet-700 text-white shadow-sm",'''

new_start = '''"stack-start-action bg-violet-700 hover:bg-violet-800 text-white border border-violet-400/80 shadow-[0_14px_30px_rgba(124,58,237,0.35)] ring-1 ring-violet-200/70 disabled:!opacity-100 disabled:!bg-violet-700 disabled:!text-white disabled:!border-violet-400 dark:bg-violet-500 dark:hover:bg-violet-400 dark:text-white dark:border-violet-300/40 dark:disabled:!bg-violet-500/25 dark:disabled:!text-violet-100 dark:disabled:!border-violet-300/30",'''

old_button = '''disabled:opacity-50 transition-colors flex-shrink-0 ${primaryAction.classes}'''

new_button = '''disabled:cursor-not-allowed transition-colors flex-shrink-0 ${primaryAction.classes}'''

if old_start not in text:
    raise RuntimeError("Could not find the Start action class block. Original left untouched.")

if old_button not in text:
    raise RuntimeError("Could not find the rendered button disabled opacity class. Original left untouched.")

text = text.replace(old_start, new_start, 1)
text = text.replace(old_button, new_button, 1)

path.write_text(text)

print("✅ Moves Start button contrast v3 applied successfully.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed:")
print("- Start button now has stronger violet contrast in light mode")
print("- Removed the global disabled:opacity-50 fade from the rendered action button")
print("- Disabled Start button stays readable instead of disappearing")
print("- Review button remains protected by its own disabled styling")
