from pathlib import Path
import re
from datetime import datetime

TARGET = Path("src/pages/Settings.jsx")

def main():
    print("[fix_settings_save_button_solid] starting")

    text = TARGET.read_text()

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = TARGET.with_name(f"Settings.jsx.bak.before-save-button-solid-{timestamp}")
    backup.write_text(text)

    save_marker = "          {/* Save Button */}"
    if save_marker not in text:
        raise SystemExit("[fix_settings_save_button_solid] ERROR: Save Button marker not found")

    start = text.index(save_marker)
    end_marker = "          </button>"
    end = text.index(end_marker, start) + len(end_marker)

    new_button = """          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            aria-busy={saving ? 'true' : 'false'}
            data-settings-save-button="true"
            style={{
              color: '#FFFFFF',
              background: 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 48%, #D946EF 100%)',
              backgroundImage: 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 48%, #D946EF 100%)',
              border: '1px solid rgba(167, 139, 250, 0.88)',
              boxShadow: saving
                ? '0 12px 30px rgba(124, 58, 237, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.18)'
                : '0 18px 45px rgba(124, 58, 237, 0.30), inset 0 1px 0 rgba(255, 255, 255, 0.24)',
              opacity: saving ? 0.78 : 1,
            }}
            className="settings-save-button-solid mx-auto mt-10 inline-flex min-w-[190px] items-center justify-center rounded-full px-9 py-3 text-sm font-bold tracking-wide !text-white transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-violet-500/25 active:translate-y-0 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            <span className="relative z-10">
              {saving ? 'Saving Your Future...' : 'Save Changes'}
            </span>
          </button>"""

    updated = text[:start] + new_button + text[end:]

    # Remove the previous class-based override block if it exists.
    updated, removed_old = re.subn(
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

    if removed_old:
        print("[fix_settings_save_button_solid] removed old class-based save button CSS block")
    else:
        print("[fix_settings_save_button_solid] old save button CSS block not found; continuing")

    solid_css_marker = "        {/* SETTINGS SAVE BUTTON SOLID OVERRIDE */}"
    solid_css = """
        {/* SETTINGS SAVE BUTTON SOLID OVERRIDE */}
        <style>{`
          .settings-page-surface button[data-settings-save-button="true"] {
            appearance: none !important;
            color: #FFFFFF !important;
            background: linear-gradient(135deg, #7C3AED 0%, #8B5CF6 48%, #D946EF 100%) !important;
            background-image: linear-gradient(135deg, #7C3AED 0%, #8B5CF6 48%, #D946EF 100%) !important;
            border: 1px solid rgba(167, 139, 250, 0.88) !important;
            box-shadow:
              0 18px 45px rgba(124, 58, 237, 0.30),
              inset 0 1px 0 rgba(255, 255, 255, 0.24) !important;
            opacity: 1 !important;
          }

          .settings-page-surface button[data-settings-save-button="true"]:hover {
            background: linear-gradient(135deg, #6D28D9 0%, #7C3AED 48%, #C026D3 100%) !important;
            background-image: linear-gradient(135deg, #6D28D9 0%, #7C3AED 48%, #C026D3 100%) !important;
            box-shadow:
              0 22px 55px rgba(124, 58, 237, 0.38),
              inset 0 1px 0 rgba(255, 255, 255, 0.26) !important;
          }

          .settings-page-surface button[data-settings-save-button="true"]:disabled {
            opacity: 0.78 !important;
            filter: saturate(0.92) !important;
          }
        `}</style>
"""

    if solid_css_marker not in updated:
        form_close = "        </form>\n"
        if form_close not in updated:
            raise SystemExit("[fix_settings_save_button_solid] ERROR: closing form marker not found")

        updated = updated.replace(form_close, form_close + solid_css, 1)

    checks = [
        'data-settings-save-button="true"',
        "settings-save-button-solid",
        "SETTINGS SAVE BUTTON SOLID OVERRIDE",
        "Saving Your Future...",
        "linear-gradient(135deg, #7C3AED 0%, #8B5CF6 48%, #D946EF 100%)",
    ]

    for check in checks:
        if check not in updated:
            raise SystemExit(f"[fix_settings_save_button_solid] ERROR: missing verification marker: {check}")

    TARGET.write_text(updated)

    print(f"[fix_settings_save_button_solid] backup created: {backup}")
    print("[fix_settings_save_button_solid] complete")
    print()
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "SETTINGS SAVE BUTTON SOLID OVERRIDE|settings-save-button-solid|data-settings-save-button|Save Changes|Saving Your Future" src/pages/Settings.jsx -C 6')
    print("  git diff -- src/pages/Settings.jsx")

if __name__ == "__main__":
    main()
