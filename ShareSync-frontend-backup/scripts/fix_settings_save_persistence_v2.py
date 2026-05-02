from pathlib import Path
import shutil
import sys

ROOT = Path.cwd()
path = ROOT / "src/pages/Settings.jsx"
backup = path.with_suffix(path.suffix + ".bak.before-settings-save-persistence-v2")

def fail(msg):
    print(f"\n[fix_settings_save_persistence_v2] ERROR: {msg}")
    sys.exit(1)

def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        fail(f"{label}: expected 1 occurrence, found {count}")
    return text.replace(old, new, 1)

def main():
    print("[fix_settings_save_persistence_v2] starting")

    if not path.exists():
        fail(f"file not found: {path}")

    text = path.read_text()

    if "SETTINGS SAVE PERSISTENCE BRIDGE" in text:
        fail("Settings persistence bridge already exists. Stop here and inspect the file before rerunning.")

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
  // Backend remains the primary source, but this local snapshot prevents
  // Settings.jsx from showing stale values after navigation if the API response
  // lags or returns an older settings shape.
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
      // Non-fatal. The backend save already succeeded.
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

    load_anchor = '''    getSettings()
      .then((settings) => {
        if (ignore || !settings) return;

        // Momentum
'''

    load_replacement = '''    getSettings()
      .then((loadedSettings) => {
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
        load_anchor,
        load_replacement,
        "merge local saved settings on load"
    )

    save_anchor = '''      await updateSettings(payload);

      setOk('Settings saved successfully! 🎉');
'''

    save_replacement = '''      const serverSettings = unwrapSettingsPayload(await updateSettings(payload));
      const persistedSettings = mergeSettingsForSettingsPage(serverSettings || {}, payload);

      persistSettingsSnapshot(persistedSettings);

      const savedTheme = persistedSettings?.appearance?.theme || theme;
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
        "persist saved settings after updateSettings"
    )

    shutil.copy2(path, backup)
    path.write_text(text)

    verify = path.read_text()
    checks = {
        "SETTINGS SAVE PERSISTENCE BRIDGE": 1,
        "SETTINGS_LOCAL_SNAPSHOT_KEY": 3,
        "unwrapSettingsPayload": 4,
        "mergeSettingsForSettingsPage": 2,
        "readLocalSettingsSnapshot": 2,
        "persistSettingsSnapshot(persistedSettings)": 1,
        "const serverSettings = unwrapSettingsPayload(await updateSettings(payload));": 1,
    }

    for marker, expected in checks.items():
        actual = verify.count(marker)
        if actual != expected:
            fail(f"verification failed for {marker!r}: expected {expected}, found {actual}")

    print(f"[fix_settings_save_persistence_v2] backup created: {backup}")
    print("\n[fix_settings_save_persistence_v2] complete")
    print("\nNext checks:")
    print("  npm run build")
    print("  rg -n \"SETTINGS SAVE PERSISTENCE BRIDGE|SETTINGS_LOCAL_SNAPSHOT_KEY|unwrapSettingsPayload|mergeSettingsForSettingsPage|readLocalSettingsSnapshot|persistSettingsSnapshot|const serverSettings\" src/pages/Settings.jsx -C 6")
    print("  git diff -- src/pages/Settings.jsx")

if __name__ == "__main__":
    main()
