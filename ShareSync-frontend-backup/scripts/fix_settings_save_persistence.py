from pathlib import Path
import shutil
import sys

ROOT = Path.cwd()
path = ROOT / "src/pages/Settings.jsx"
backup = path.with_suffix(path.suffix + ".bak.before-settings-save-persistence")

def fail(msg):
    print(f"\n[fix_settings_save_persistence] ERROR: {msg}")
    sys.exit(1)

def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        fail(f"{label}: expected 1 occurrence, found {count}")
    return text.replace(old, new, 1)

def main():
    print("[fix_settings_save_persistence] starting")

    if not path.exists():
        fail(f"file not found: {path}")

    text = path.read_text()

    if "SETTINGS SAVE PERSISTENCE BRIDGE" in text:
        fail("Settings persistence bridge already exists. Do not run this twice.")

    required = [
        "const normalizeThemeMode =",
        "const readSavedThemePreference =",
        "const readResolvedDocumentTheme =",
        "const applyTheme =",
    ]

    for marker in required:
        if marker not in text:
            fail(f"missing expected helper marker: {marker}")

    helper_anchor = '''    localStorage.setItem("ss.theme", mode);
    applyResolvedTheme(mode);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // LOAD SETTINGS FROM /api/settings
'''

    helper_replacement = '''    localStorage.setItem("ss.theme", mode);
    applyResolvedTheme(mode);
  };

  // SETTINGS SAVE PERSISTENCE BRIDGE
  // The backend remains the primary source, but Settings.jsx needs a local
  // confirmed snapshot so the page does not fall back to stale values after navigation.
  const SETTINGS_LOCAL_SNAPSHOT_KEY = "ss.settings";

  const unwrapSettingsPayload = (value) => {
    const payload = value?.data ?? value;

    if (!payload || typeof payload !== "object") {
      return payload;
    }

    if (payload.settings && typeof payload.settings === "object") {
      return payload.settings;
    }

    if (payload.data?.settings && typeof payload.data.settings === "object") {
      return payload.data.settings;
    }

    if (payload.data && typeof payload.data === "object") {
      return payload.data;
    }

    return payload;
  };

  const mergeSettingsForSettingsPage = (base = {}, overlay = {}) => {
    const safeBase = base && typeof base === "object" ? base : {};
    const safeOverlay = overlay && typeof overlay === "object" ? overlay : {};

    const next = {
      ...safeBase,
      ...safeOverlay,
    };

    for (const key of [
      "appearance",
      "mentor",
      "momentum",
      "focus",
      "social",
      "legacy",
      "notifications",
      "security",
    ]) {
      next[key] = {
        ...(safeBase[key] || {}),
        ...(safeOverlay[key] || {}),
      };
    }

    return next;
  };

  const readLocalSettingsSnapshot = () => {
    if (typeof window === "undefined") return null;

    try {
      const raw = window.localStorage.getItem(SETTINGS_LOCAL_SNAPSHOT_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      const unwrapped = unwrapSettingsPayload(parsed);

      return unwrapped && typeof unwrapped === "object" ? unwrapped : null;
    } catch {
      return null;
    }
  };

  const persistSettingsSnapshot = (nextSettings) => {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(
        SETTINGS_LOCAL_SNAPSHOT_KEY,
        JSON.stringify(nextSettings)
      );
      window.dispatchEvent(new Event("storage"));
    } catch {
      // Non-fatal. Backend save already succeeded.
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // LOAD SETTINGS FROM /api/settings
'''

    text = replace_once(
        text,
        helper_anchor,
        helper_replacement,
        "insert settings persistence helpers"
    )

    then_anchor = '''      .then((settings) => {
        if (ignore || !settings) return;

        // Momentum
'''

    then_replacement = '''      .then((loadedSettings) => {
        let settings = unwrapSettingsPayload(loadedSettings);
        if (ignore || !settings) return;

        const localSnapshot = readLocalSettingsSnapshot();
        if (localSnapshot) {
          settings = mergeSettingsForSettingsPage(settings, localSnapshot);
        }

        // Momentum
'''

    text = replace_once(
        text,
        then_anchor,
        then_replacement,
        "hydrate settings with local snapshot"
    )

    theme_anchor = '''        const initialTheme =
          appearance.theme ||
          localStorage.getItem('ss.theme') ||
          'dark'; // default to dark now
        setTheme(initialTheme);
        setUserMode(appearance.mode || 'pro');
        applyTheme(initialTheme);
'''

    theme_replacement = '''        const initialTheme = normalizeThemeMode(
          readSavedThemePreference() ||
            appearance.theme ||
            readResolvedDocumentTheme() ||
            'dark',
          'dark'
        );
        setTheme(initialTheme);
        setUserMode(appearance.mode || 'pro');
        applyTheme(initialTheme);
'''

    text = replace_once(
        text,
        theme_anchor,
        theme_replacement,
        "prioritize saved local theme preference"
    )

    save_anchor = '''      await updateSettings(payload);

      setOk('Settings saved successfully! 🎉');
'''

    save_replacement = '''      const serverSettings = unwrapSettingsPayload(await updateSettings(payload));
      const persistedSettings = mergeSettingsForSettingsPage(serverSettings || {}, payload);

      persistSettingsSnapshot(persistedSettings);

      const savedTheme = normalizeThemeMode(
        persistedSettings?.appearance?.theme || theme,
        theme
      );
      const savedMode = persistedSettings?.appearance?.mode || userMode;

      setTheme(savedTheme);
      setUserMode(savedMode);
      applyTheme(savedTheme);

      setOk('Settings saved successfully! 🎉');
'''

    text = replace_once(
        text,
        save_anchor,
        save_replacement,
        "persist saved settings snapshot after API save"
    )

    shutil.copy2(path, backup)
    path.write_text(text)

    verify = path.read_text()
    expected = {
        "SETTINGS SAVE PERSISTENCE BRIDGE": 1,
        "SETTINGS_LOCAL_SNAPSHOT_KEY": 3,
        "unwrapSettingsPayload": 4,
        "mergeSettingsForSettingsPage": 2,
        "persistSettingsSnapshot(persistedSettings)": 1,
        "readLocalSettingsSnapshot()": 1,
    }

    for marker, expected_count in expected.items():
        actual = verify.count(marker)
        if actual != expected_count:
            fail(f"verification failed for {marker!r}: expected {expected_count}, found {actual}")

    print(f"[fix_settings_save_persistence] backup created: {backup}")
    print("\n[fix_settings_save_persistence] complete")
    print("\nNext checks:")
    print("  npm run build")
    print("  rg -n \"SETTINGS SAVE PERSISTENCE BRIDGE|SETTINGS_LOCAL_SNAPSHOT_KEY|unwrapSettingsPayload|mergeSettingsForSettingsPage|persistSettingsSnapshot|readLocalSettingsSnapshot|const serverSettings\" src/pages/Settings.jsx -C 6")
    print("  git diff -- src/pages/Settings.jsx")

if __name__ == "__main__":
    main()
