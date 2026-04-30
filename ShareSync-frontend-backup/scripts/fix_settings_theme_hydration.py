from pathlib import Path
import shutil
import sys

ROOT = Path.cwd()
TARGET = ROOT / "src/pages/Settings.jsx"
BACKUP = ROOT / "src/pages/Settings.jsx.bak.before-theme-hydration-fix"

def require_count(text, needle, expected, label):
    count = text.count(needle)
    if count != expected:
        print(f"\n[fix_settings_theme_hydration] ERROR: {label}: expected {expected}, found {count}")
        sys.exit(1)

def main():
    print("[fix_settings_theme_hydration] starting")

    if not TARGET.exists():
        print(f"\n[fix_settings_theme_hydration] ERROR: missing file: {TARGET}")
        sys.exit(1)

    text = TARGET.read_text()

    old_helper_anchor = """  const mqlRef = useRef(null);

  const applyTheme = (mode) => {"""

    new_helper_anchor = """  const mqlRef = useRef(null);

  // SETTINGS THEME HYDRATION FIX
  // Settings.jsx should display the actual user-selected theme, not a stale
  // backend fallback. The local theme is the immediate source of truth because
  // applyTheme() writes it as soon as the user changes the dropdown.
  const normalizeThemeMode = (value, fallback = 'system') => {
    return value === 'light' || value === 'dark' || value === 'system'
      ? value
      : fallback;
  };

  const readSavedThemePreference = () => {
    if (typeof window === 'undefined') return null;
    return normalizeThemeMode(window.localStorage.getItem('ss.theme'), null);
  };

  const readResolvedDocumentTheme = () => {
    if (typeof document === 'undefined') return null;

    const root = document.documentElement;

    if (root.dataset.theme === 'dark' || root.classList.contains('dark')) {
      return 'dark';
    }

    if (root.dataset.theme === 'light') {
      return 'light';
    }

    return null;
  };

  const applyTheme = (mode) => {"""

    old_load_block = """        // Appearance
        const appearance = settings.appearance || {};
        const initialTheme =
          appearance.theme ||
          localStorage.getItem('ss.theme') ||
          'dark'; // default to dark now
        setTheme(initialTheme);
        setUserMode(appearance.mode || 'pro');
        applyTheme(initialTheme);"""

    new_load_block = """        // Appearance
        const appearance = settings.appearance || {};

        // Theme hydration priority:
        // 1. Local immediate user choice from applyTheme()
        // 2. Backend saved setting
        // 3. Current DOM-resolved theme
        // 4. System fallback
        const storedTheme = readSavedThemePreference();
        const backendTheme = normalizeThemeMode(appearance.theme, null);
        const documentTheme = readResolvedDocumentTheme();
        const initialTheme =
          storedTheme ||
          backendTheme ||
          documentTheme ||
          'system';

        setTheme(initialTheme);
        setUserMode(appearance.mode || 'pro');
        applyTheme(initialTheme);"""

    old_select_change = """                onChange={(e) => {
                  setTheme(e.target.value);
                  applyTheme(e.target.value);
                }}"""

    new_select_change = """                onChange={(e) => {
                  const nextTheme = normalizeThemeMode(e.target.value, 'system');
                  setTheme(nextTheme);
                  applyTheme(nextTheme);
                }}"""

    replacements = [
        (old_helper_anchor, new_helper_anchor, "insert theme hydration helpers"),
        (old_load_block, new_load_block, "replace appearance hydration priority"),
        (old_select_change, new_select_change, "normalize select theme change"),
    ]

    for old, _new, label in replacements:
        require_count(text, old, 1, label)

    updated = text
    for old, new, _label in replacements:
        updated = updated.replace(old, new, 1)

    markers = {
        "SETTINGS THEME HYDRATION FIX": 1,
        "const storedTheme = readSavedThemePreference();": 1,
        "const backendTheme = normalizeThemeMode(appearance.theme, null);": 1,
        "const nextTheme = normalizeThemeMode(e.target.value, 'system');": 1,
    }

    for marker, expected in markers.items():
        require_count(updated, marker, expected, f"post-check marker {marker}")

    if not BACKUP.exists():
        shutil.copy2(TARGET, BACKUP)
        print(f"[fix_settings_theme_hydration] backup created: {BACKUP}")
    else:
        print(f"[fix_settings_theme_hydration] backup already exists: {BACKUP}")

    TARGET.write_text(updated)

    print("\n[fix_settings_theme_hydration] complete")
    print("\nNext checks:")
    print("  npm run build")
    print("  rg -n \"SETTINGS THEME HYDRATION FIX|normalizeThemeMode|readSavedThemePreference|readResolvedDocumentTheme|storedTheme|backendTheme|nextTheme\" src/pages/Settings.jsx -C 6")
    print("  git diff -- src/pages/Settings.jsx")

if __name__ == '__main__':
    main()
