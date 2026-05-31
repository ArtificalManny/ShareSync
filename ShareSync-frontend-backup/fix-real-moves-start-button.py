from pathlib import Path
from datetime import datetime
import re
import shutil

path = Path("src/features/stack/StackTaskRow.jsx")

if not path.exists():
    raise RuntimeError(f"Missing file: {path}")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = path.with_suffix(path.suffix + f".backup-before-real-start-button-fix-{stamp}")
shutil.copy2(path, backup)

text = path.read_text()

original = text

# 1) Make the Start action itself stronger.
old_start_classes = '"stack-start-action bg-violet-600 hover:bg-violet-700 text-white shadow-sm"'
new_start_classes = (
    '"stack-start-action openshare-start-cta '
    '!bg-violet-700 hover:!bg-violet-800 '
    '!text-white border border-violet-400/90 '
    'shadow-[0_14px_34px_rgba(124,58,237,0.42)] '
    'ring-1 ring-white/60 '
    'disabled:!opacity-100 disabled:!bg-violet-700 disabled:!text-white '
    'disabled:!border-violet-400/90 disabled:cursor-not-allowed"'
)

if old_start_classes not in text:
    raise RuntimeError(
        "Could not find the Start classes line. Run:\n"
        "grep -n -B 5 -A 8 'stack-start-action' src/features/stack/StackTaskRow.jsx"
    )

text = text.replace(old_start_classes, new_start_classes, 1)

# 2) Stop the whole task row from fading out and hiding the action button.
text = text.replace(
    '${disabled && !completing ? "opacity-60" : ""}',
    '${disabled && !completing ? "opacity-100" : ""}',
    1,
)

# 3) Remove the weak disabled opacity from the button itself.
text = text.replace(
    "disabled:opacity-50 transition-colors flex-shrink-0 ${primaryAction.classes}",
    "disabled:!opacity-100 transition-colors flex-shrink-0 ${primaryAction.classes}",
    1,
)

# 4) Add a data attribute so CSS/debugging can target the Start button directly.
button_open = '''<button
                  type="button"
                  disabled={disabled}
                  onClick={primaryAction.onClick}'''

button_open_replacement = '''<button
                  type="button"
                  disabled={disabled}
                  onClick={primaryAction.onClick}
                  data-openshare-start-force={primaryAction.label === "Start" ? "true" : undefined}'''

if button_open not in text:
    raise RuntimeError(
        "Could not find the primary action button opening block. Run:\n"
        "grep -n -B 8 -A 16 'primaryAction.onClick' src/features/stack/StackTaskRow.jsx"
    )

text = text.replace(button_open, button_open_replacement, 1)

if text == original:
    raise RuntimeError("No changes were made.")

path.write_text(text)

print("✅ Real Moves Start button fix applied.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed:")
print("- Start button gets strong violet CTA styling")
print("- Disabled Start button remains readable")
print("- Parent row no longer fades the whole task row")
print("- Added data-openshare-start-force for future targeting")
print("")
print("Next:")
print("1. Stop Vite with Control+C")
print("2. Restart: npm run dev")
print("3. Hard refresh Chrome: Cmd+Shift+R")
