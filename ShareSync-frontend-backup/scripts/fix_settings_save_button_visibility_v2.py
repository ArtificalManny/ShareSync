from pathlib import Path
from datetime import datetime

TARGET = Path("src/pages/Settings.jsx")

OLD_SAVE_BUTTON_BLOCK = '''          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className="settings-save-button inline-flex items-center justify-center rounded-full px-8 py-3 text-sm font-bold tracking-wide text-white shadow-lg shadow-violet-500/25 transition-all duration-200 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/35 focus:outline-none focus:ring-4 focus:ring-violet-300/50 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 dark:from-violet-500 dark:via-purple-500 dark:to-fuchsia-500 dark:shadow-violet-900/30 dark:focus:ring-violet-500/30"
            style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' }}
          >
            {saving ? 'Saving Your Future...' : 'Save Changes'}
          </button>'''

NEW_SAVE_BUTTON_BLOCK = '''          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            aria-busy={saving ? 'true' : 'false'}
            className="settings-save-button settings-save-button--primary mx-auto mt-10 flex w-fit min-w-[190px] items-center justify-center rounded-full px-9 py-3 text-sm font-bold tracking-wide text-white transition-all duration-200 hover:-translate-y-0.5 focus:outline-none active:translate-y-0 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {saving ? 'Saving Your Future...' : 'Save Changes'}
          </button>'''

OLD_STYLE_INSERT_ANCHOR = '''        </form>

      </div>
    </main>'''

NEW_STYLE_INSERT_ANCHOR = '''        </form>

        {/* SETTINGS SAVE BUTTON VISIBILITY OVERRIDE */}
        <style>{`
          .settings-page-surface .settings-save-button--primary {
            appearance: none !important;
            display: flex !important;
            width: fit-content !important;
            min-width: 190px !important;
            margin-left: auto !important;
            margin-right: auto !important;
            color: #ffffff !important;
            background: linear-gradient(135deg, #7C3AED 0%, #8B5CF6 48%, #D946EF 100%) !important;
            background-image: linear-gradient(135deg, #7C3AED 0%, #8B5CF6 48%, #D946EF 100%) !important;
            border: 1px solid rgba(167, 139, 250, 0.72) !important;
            box-shadow:
              0 18px 45px rgba(124, 58, 237, 0.28),
              0 0 0 1px rgba(255, 255, 255, 0.18) inset !important;
            opacity: 1 !important;
            text-decoration: none !important;
          }

          .settings-page-surface .settings-save-button--primary:hover {
            background: linear-gradient(135deg, #6D28D9 0%, #7C3AED 48%, #C026D3 100%) !important;
            background-image: linear-gradient(135deg, #6D28D9 0%, #7C3AED 48%, #C026D3 100%) !important;
            box-shadow:
              0 22px 55px rgba(124, 58, 237, 0.36),
              0 0 0 1px rgba(255, 255, 255, 0.22) inset !important;
          }

          .settings-page-surface .settings-save-button--primary:disabled {
            opacity: 0.72 !important;
            filter: saturate(0.88) !important;
          }

          html.dark .settings-page-surface .settings-save-button--primary,
          [data-theme="dark"] .settings-page-surface .settings-save-button--primary {
            background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 48%, #D946EF 100%) !important;
            background-image: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 48%, #D946EF 100%) !important;
            border-color: rgba(196, 181, 253, 0.64) !important;
            box-shadow:
              0 18px 52px rgba(124, 58, 237, 0.34),
              0 0 0 1px rgba(255, 255, 255, 0.14) inset !important;
          }
        `}</style>

      </div>
    </main>'''

def require_count(text, needle, expected, label):
    count = text.count(needle)
    if count != expected:
        raise SystemExit(f"[fix_settings_save_button_visibility_v2] ERROR: {label}: expected {expected}, found {count}")

def main():
    print("[fix_settings_save_button_visibility_v2] starting")

    if not TARGET.exists():
        raise SystemExit(f"[fix_settings_save_button_visibility_v2] ERROR: missing {TARGET}")

    original = TARGET.read_text()

    require_count(original, OLD_SAVE_BUTTON_BLOCK, 1, "exact old Save Button block")

    if "SETTINGS SAVE BUTTON VISIBILITY OVERRIDE" in original:
        raise SystemExit("[fix_settings_save_button_visibility_v2] ERROR: visibility override already exists")

    require_count(original, OLD_STYLE_INSERT_ANCHOR, 1, "style insertion anchor")

    updated = original.replace(OLD_SAVE_BUTTON_BLOCK, NEW_SAVE_BUTTON_BLOCK)
    updated = updated.replace(OLD_STYLE_INSERT_ANCHOR, NEW_STYLE_INSERT_ANCHOR)

    require_count(updated, "settings-save-button--primary", 6, "new save button class + css references")
    require_count(updated, "SETTINGS SAVE BUTTON VISIBILITY OVERRIDE", 1, "css override marker")
    require_count(updated, "aria-busy={saving ? 'true' : 'false'}", 1, "aria busy line")
    require_count(updated, "Save Changes", 1, "save label remains")

    backup = TARGET.with_name(
        f"{TARGET.name}.bak.before-save-button-visibility-v2-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    )
    backup.write_text(original)
    TARGET.write_text(updated)

    print(f"[fix_settings_save_button_visibility_v2] backup created: {backup}")
    print("[fix_settings_save_button_visibility_v2] complete")
    print("\nNext checks:")
    print("  npm run build")
    print('  rg -n "SETTINGS SAVE BUTTON VISIBILITY OVERRIDE|settings-save-button--primary|Save Changes|aria-busy" src/pages/Settings.jsx -C 6')
    print("  git diff -- src/pages/Settings.jsx")

if __name__ == "__main__":
    main()
