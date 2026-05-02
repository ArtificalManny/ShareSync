from pathlib import Path
import re
from datetime import datetime

TARGET = Path("src/pages/Settings.jsx")

def main():
    print("[fix_settings_save_button_inner_span] starting")

    text = TARGET.read_text()

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = TARGET.with_name(f"Settings.jsx.bak.before-save-button-inner-span-{timestamp}")
    backup.write_text(text)

    marker = "          {/* Save Button */}"
    if marker not in text:
        raise SystemExit("[fix_settings_save_button_inner_span] ERROR: Save Button marker not found")

    start = text.index(marker)

    # Replace from Save Button marker through its closing </button>.
    end_marker = "          </button>"
    end = text.index(end_marker, start) + len(end_marker)

    new_block = """          {/* Save Button */}
          <div className="flex justify-center pt-4">
            <button
              type="submit"
              disabled={saving}
              aria-busy={saving ? 'true' : 'false'}
              data-settings-save-button="true"
              className="group inline-flex rounded-full p-[1.5px] bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 shadow-[0_18px_45px_rgba(124,58,237,0.26)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_58px_rgba(124,58,237,0.38)] focus:outline-none focus:ring-4 focus:ring-violet-500/25 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
            >
              <span
                data-settings-save-button-inner="true"
                className="inline-flex min-w-[210px] items-center justify-center rounded-full px-10 py-3.5 text-sm font-extrabold tracking-wide !text-white bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 transition-all duration-200 group-hover:from-violet-700 group-hover:via-purple-700 group-hover:to-fuchsia-700 dark:from-violet-500 dark:via-purple-500 dark:to-fuchsia-500"
              >
                {saving ? 'Saving Your Future...' : 'Save Changes'}
              </span>
            </button>
          </div>"""

    updated = text[:start] + new_block + text[end:]

    # Remove old save-button style overrides if present.
    updated, removed_visibility = re.subn(
        r"""
        \n\s*\{/\*\s*SETTINGS\s+SAVE\s+BUTTON\s+VISIBILITY\s+OVERRIDE\s*\*/\}
        \s*<style>\{`
        [\s\S]*?
        `\}</style>\s*
        """,
        "\n",
        updated,
        count=1,
        flags=re.VERBOSE,
    )

    updated, removed_solid = re.subn(
        r"""
        \n\s*\{/\*\s*SETTINGS\s+SAVE\s+BUTTON\s+SOLID\s+OVERRIDE\s*\*/\}
        \s*<style>\{`
        [\s\S]*?
        `\}</style>\s*
        """,
        "\n",
        updated,
        count=1,
        flags=re.VERBOSE,
    )

    if removed_visibility:
        print("[fix_settings_save_button_inner_span] removed old visibility CSS block")
    if removed_solid:
        print("[fix_settings_save_button_inner_span] removed old solid CSS block")

    checks = [
        'data-settings-save-button="true"',
        'data-settings-save-button-inner="true"',
        'from-violet-600 via-purple-600 to-fuchsia-600',
        'Save Changes',
        'Saving Your Future...',
    ]

    for check in checks:
        if check not in updated:
            raise SystemExit(f"[fix_settings_save_button_inner_span] ERROR: missing marker: {check}")

    TARGET.write_text(updated)

    print(f"[fix_settings_save_button_inner_span] backup created: {backup}")
    print("[fix_settings_save_button_inner_span] complete")
    print()
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "data-settings-save-button|data-settings-save-button-inner|from-violet-600|Save Changes|Saving Your Future" src/pages/Settings.jsx -C 6')
    print("  git diff -- src/pages/Settings.jsx")

if __name__ == "__main__":
    main()
