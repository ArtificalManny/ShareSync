from pathlib import Path
import shutil
from datetime import datetime

TARGET = Path("src/pages/Settings.jsx")

NEW_CLASS = """settings-save-button inline-flex items-center justify-center rounded-full px-8 py-3 text-sm font-bold tracking-wide text-white shadow-lg shadow-violet-500/25 transition-all duration-200 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/35 focus:outline-none focus:ring-4 focus:ring-violet-300/50 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 dark:from-violet-500 dark:via-purple-500 dark:to-fuchsia-500 dark:shadow-violet-900/30 dark:focus:ring-violet-500/30"""

def fail(message):
    print(f"\n[polish_settings_save_button] ERROR: {message}")
    raise SystemExit(1)

def main():
    print("[polish_settings_save_button] starting")

    if not TARGET.exists():
        fail(f"missing file: {TARGET}")

    source = TARGET.read_text()

    marker = "Save Changes"
    marker_count = source.count(marker)
    if marker_count != 1:
        fail(f'expected exactly 1 "{marker}" marker, found {marker_count}')

    marker_index = source.index(marker)

    button_start = source.rfind("<button", 0, marker_index)
    if button_start == -1:
        fail("could not find opening <button before Save Changes")

    button_end = source.find("</button>", marker_index)
    if button_end == -1:
        fail("could not find closing </button> after Save Changes")

    button_end += len("</button>")
    button_block = source[button_start:button_end]

    if "settings-save-button" in button_block:
        print("[polish_settings_save_button] save button already polished")
        return

    class_key = 'className="'
    class_start = button_block.find(class_key)
    if class_start == -1:
        fail("Save Changes button does not have a className string")

    class_value_start = class_start + len(class_key)
    class_value_end = button_block.find('"', class_value_start)
    if class_value_end == -1:
        fail("could not find end of Save Changes button className")

    old_class = button_block[class_value_start:class_value_end]

    new_button_block = (
        button_block[:class_value_start]
        + NEW_CLASS
        + button_block[class_value_end:]
    )

    updated = source[:button_start] + new_button_block + source[button_end:]

    if updated == source:
        fail("no changes made")

    if updated.count("settings-save-button") != 1:
        fail("verification failed: settings-save-button should appear exactly once")

    if updated.count(marker) != 1:
        fail("verification failed: Save Changes marker count changed")

    backup = TARGET.with_name(
        f"{TARGET.name}.bak.before-save-button-purple-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    )
    shutil.copy2(TARGET, backup)
    TARGET.write_text(updated)

    print(f"[polish_settings_save_button] backup created: {backup}")
    print("[polish_settings_save_button] complete")
    print("\nNext checks:")
    print("  npm run build")
    print('  rg -n "settings-save-button|Save Changes" src/pages/Settings.jsx -C 5')
    print("  git diff -- src/pages/Settings.jsx")

if __name__ == "__main__":
    main()
