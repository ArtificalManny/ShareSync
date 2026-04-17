from pathlib import Path
import re
import shutil

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
BACKUP_ROOT = ROOT / ".chatgpt-backups-theme-fix"

BACKUP_ROOT.mkdir(parents=True, exist_ok=True)


def backup_file(path: Path) -> None:
    rel = path.relative_to(ROOT)
    dst = BACKUP_ROOT / rel
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(path, dst)


def write_file(path: Path, content: str) -> None:
    if path.exists():
        backup_file(path)
    else:
        path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print(f"✅ wrote {path}")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise RuntimeError(f"Could not find exact block for: {label}")
    return text.replace(old, new, 1)


def regex_replace_once(text: str, pattern: str, replacement: str, label: str) -> str:
    new_text, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
    if count != 1:
        raise RuntimeError(f"Could not regex-replace block for: {label}")
    return new_text


# ──────────────────────────────────────────────────────────────────────────────
# 1) Rewrite LayoutSkin.jsx to be theme-aware instead of forcing light-theme
# ──────────────────────────────────────────────────────────────────────────────
layout_skin_path = ROOT / "src/components/LayoutSkin.jsx"
layout_skin_content = """// src/components/LayoutSkin.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// LAYOUT SKIN - Theme Application Layer
//
// This component applies structural layout rules only.
// It no longer hard-forces a light theme on the entire app shell.
//
// NO BACKEND CHANGES.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect } from "react";

export default function LayoutSkin({ children, className = "" }) {
  useEffect(() => {
    document.body.style.minHeight = "100vh";
    document.body.style.height = "auto";

    console.log("✅ LayoutSkin applied - theme-aware shell active");

    return () => {
      document.body.style.minHeight = "";
      document.body.style.height = "";
    };
  }, []);

  return (
    <div
      className={`layout-skin app-canvas min-h-screen ${className}`}
      style={{
        isolation: "isolate",
        minHeight: "100vh",
        height: "auto",
      }}
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// THEME UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

export function useTheme() {
  const [theme, setTheme] = React.useState("light");

  useEffect(() => {
    const syncTheme = () => {
      const savedTheme = localStorage.getItem("ss.theme") || "system";
      const systemDark =
        typeof window !== "undefined" &&
        !!window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;

      const resolvedTheme =
        savedTheme === "system"
          ? systemDark
            ? "dark"
            : "light"
          : savedTheme;

      setTheme(resolvedTheme);
    };

    syncTheme();
    window.addEventListener("storage", syncTheme);

    return () => {
      window.removeEventListener("storage", syncTheme);
    };
  }, []);

  return {
    theme,
    isLight: theme === "light",
    isDark: theme === "dark",
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// THEME PROVIDER
// ═══════════════════════════════════════════════════════════════════════════════

const ThemeContext = React.createContext({
  theme: "light",
  isLight: true,
  isDark: false,
});

export function ThemeProvider({ children }) {
  const themeValue = useTheme();

  return (
    <ThemeContext.Provider value={themeValue}>
      <LayoutSkin>{children}</LayoutSkin>
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  return React.useContext(ThemeContext);
}
"""
write_file(layout_skin_path, layout_skin_content)


# ──────────────────────────────────────────────────────────────────────────────
# 2) Add one final CSS escape hatch imported LAST
# ──────────────────────────────────────────────────────────────────────────────
theme_escape_path = ROOT / "src/styles/theme-escape-hatch.css"
theme_escape_content = """/* src/styles/theme-escape-hatch.css
   FINAL THEME OVERRIDE LAYER
   Imported last on purpose so older light-only shell rules cannot win.
*/

/* ─────────────────────────────────────────────────────────────────────────────
   LIGHT TOKENS (final authority)
───────────────────────────────────────────────────────────────────────────── */
html:not(.dark),
html[data-theme="light"] {
  --surface-0: #F8FAFC !important;
  --surface-1: #FFFFFF !important;
  --surface-2: #F1F5F9 !important;

  --text-primary: #1E293B !important;
  --text-secondary: #475569 !important;
  --text-tertiary: #64748B !important;

  --border-default: #E2E8F0 !important;
  --border-subtle: #F1F5F9 !important;

  color-scheme: light !important;
}

/* ─────────────────────────────────────────────────────────────────────────────
   DARK TOKENS (final authority)
───────────────────────────────────────────────────────────────────────────── */
html.dark,
html[data-theme="dark"] {
  --surface-0: #09090B !important;
  --surface-1: #18181B !important;
  --surface-2: #27272A !important;

  --text-primary: #F5F5F7 !important;
  --text-secondary: #CBD5E1 !important;
  --text-tertiary: #94A3B8 !important;

  --border-default: rgba(255, 255, 255, 0.10) !important;
  --border-subtle: rgba(255, 255, 255, 0.06) !important;

  color-scheme: dark !important;
}

/* ─────────────────────────────────────────────────────────────────────────────
   GLOBAL CANVAS
───────────────────────────────────────────────────────────────────────────── */
html:not(.dark) body,
html[data-theme="light"] body,
html:not(.dark) .layout-skin,
html[data-theme="light"] .layout-skin,
html:not(.dark) .app-container,
html[data-theme="light"] .app-container,
html:not(.dark) .main-layout,
html[data-theme="light"] .main-layout,
html:not(.dark) .app-layout,
html[data-theme="light"] .app-layout,
html:not(.dark) .main-content,
html[data-theme="light"] .main-content,
html:not(.dark) .content-wrapper,
html[data-theme="light"] .content-wrapper {
  background: #F8FAFC !important;
  color: #1E293B !important;
}

html.dark body,
html[data-theme="dark"] body,
html.dark .layout-skin,
html[data-theme="dark"] .layout-skin,
html.dark .app-container,
html[data-theme="dark"] .app-container,
html.dark .main-layout,
html[data-theme="dark"] .main-layout,
html.dark .app-layout,
html[data-theme="dark"] .app-layout,
html.dark .main-content,
html[data-theme="dark"] .main-content,
html.dark .content-wrapper,
html[data-theme="dark"] .content-wrapper {
  background: #09090B !important;
  color: #F5F5F7 !important;
}

/* ─────────────────────────────────────────────────────────────────────────────
   NAV + SIDEBAR CHROME
───────────────────────────────────────────────────────────────────────────── */
html:not(.dark) .navbar,
html[data-theme="light"] .navbar {
  background: rgba(255, 255, 255, 0.88) !important;
  border-bottom-color: rgba(226, 232, 240, 0.9) !important;
}

html.dark .navbar,
html[data-theme="dark"] .navbar {
  background: rgba(9, 9, 11, 0.85) !important;
  border-bottom-color: rgba(255, 255, 255, 0.08) !important;
}

html:not(.dark) #app-sidebar,
html[data-theme="light"] #app-sidebar {
  background-color: #FFFFFF !important;
  border-right-color: #E2E8F0 !important;
}

html.dark #app-sidebar,
html[data-theme="dark"] #app-sidebar {
  background-color: #111827 !important;
  border-right-color: rgba(255, 255, 255, 0.08) !important;
}

/* ─────────────────────────────────────────────────────────────────────────────
   CARDS + PANELS
───────────────────────────────────────────────────────────────────────────── */
html:not(.dark) .card,
html:not(.dark) .bento-card,
html:not(.dark) .glass,
html:not(.dark) .glass-card,
html:not(.dark) .panel,
html:not(.dark) .surface,
html:not(.dark) .tile,
html:not(.dark) [class*="Card"],
html[data-theme="light"] .card,
html[data-theme="light"] .bento-card,
html[data-theme="light"] .glass,
html[data-theme="light"] .glass-card,
html[data-theme="light"] .panel,
html[data-theme="light"] .surface,
html[data-theme="light"] .tile,
html[data-theme="light"] [class*="Card"] {
  background-color: #FFFFFF !important;
  border-color: #E2E8F0 !important;
  color: #1E293B !important;
}

html.dark .card,
html.dark .bento-card,
html.dark .glass,
html.dark .glass-card,
html.dark .panel,
html.dark .surface,
html.dark .tile,
html.dark [class*="Card"],
html[data-theme="dark"] .card,
html[data-theme="dark"] .bento-card,
html[data-theme="dark"] .glass,
html[data-theme="dark"] .glass-card,
html[data-theme="dark"] .panel,
html[data-theme="dark"] .surface,
html[data-theme="dark"] .tile,
html[data-theme="dark"] [class*="Card"] {
  background-color: #18181B !important;
  border-color: rgba(255, 255, 255, 0.10) !important;
  color: #F5F5F7 !important;
}

/* ─────────────────────────────────────────────────────────────────────────────
   INPUTS + FORM CONTROLS
───────────────────────────────────────────────────────────────────────────── */
html:not(.dark) input:not([type="checkbox"]):not([type="radio"]),
html:not(.dark) textarea,
html:not(.dark) select,
html[data-theme="light"] input:not([type="checkbox"]):not([type="radio"]),
html[data-theme="light"] textarea,
html[data-theme="light"] select {
  background-color: #FFFFFF !important;
  border-color: #E2E8F0 !important;
  color: #1E293B !important;
}

html.dark input:not([type="checkbox"]):not([type="radio"]),
html.dark textarea,
html.dark select,
html[data-theme="dark"] input:not([type="checkbox"]):not([type="radio"]),
html[data-theme="dark"] textarea,
html[data-theme="dark"] select {
  background-color: rgba(24, 24, 27, 0.92) !important;
  border-color: rgba(255, 255, 255, 0.10) !important;
  color: #F5F5F7 !important;
}

html.dark input::placeholder,
html.dark textarea::placeholder,
html[data-theme="dark"] input::placeholder,
html[data-theme="dark"] textarea::placeholder {
  color: #94A3B8 !important;
}

/* ─────────────────────────────────────────────────────────────────────────────
   MENUS + MODALS
───────────────────────────────────────────────────────────────────────────── */
html:not(.dark) [role="menu"],
html:not(.dark) [role="listbox"],
html:not(.dark) .dropdown-menu,
html:not(.dark) .modal-content,
html:not(.dark) [role="dialog"] > div,
html[data-theme="light"] [role="menu"],
html[data-theme="light"] [role="listbox"],
html[data-theme="light"] .dropdown-menu,
html[data-theme="light"] .modal-content,
html[data-theme="light"] [role="dialog"] > div {
  background-color: #FFFFFF !important;
  border-color: #E2E8F0 !important;
  color: #1E293B !important;
}

html.dark [role="menu"],
html.dark [role="listbox"],
html.dark .dropdown-menu,
html.dark .modal-content,
html.dark [role="dialog"] > div,
html[data-theme="dark"] [role="menu"],
html[data-theme="dark"] [role="listbox"],
html[data-theme="dark"] .dropdown-menu,
html[data-theme="dark"] .modal-content,
html[data-theme="dark"] [role="dialog"] > div {
  background-color: #18181B !important;
  border-color: rgba(255, 255, 255, 0.10) !important;
  color: #F5F5F7 !important;
}

html.dark .modal-backdrop,
html.dark [class*="backdrop"],
html[data-theme="dark"] .modal-backdrop,
html[data-theme="dark"] [class*="backdrop"] {
  background-color: rgba(0, 0, 0, 0.55) !important;
}
"""
write_file(theme_escape_path, theme_escape_content)


# ──────────────────────────────────────────────────────────────────────────────
# 3) Patch App.jsx
# ──────────────────────────────────────────────────────────────────────────────
app_path = ROOT / "src/App.jsx"
backup_file(app_path)
app_text = app_path.read_text(encoding="utf-8")

if 'import "./styles/theme-escape-hatch.css";' not in app_text:
    app_text = replace_once(
        app_text,
        'import "./styles/mobile-overrides.css";\n',
        'import "./styles/mobile-overrides.css";\nimport "./styles/theme-escape-hatch.css";\n',
        "App.jsx CSS import insertion",
    )

app_text = regex_replace_once(
    app_text,
    r'function ThemeSync\(\) \{.*?\n\}\n\nconst App = \(\) => \{',
    """function ThemeSync() {
  const { user } = useAuth();

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : null;

    const applyResolvedTheme = () => {
      const savedTheme =
        user?.preferences?.theme || localStorage.getItem("ss.theme") || "system";

      const isDark =
        savedTheme === "dark" ||
        (savedTheme === "system" && Boolean(media?.matches));

      root.classList.toggle("dark", isDark);
      root.dataset.theme = isDark ? "dark" : "light";
      document.body.style.backgroundColor = isDark ? "#09090B" : "#F8FAFC";
    };

    applyResolvedTheme();

    const handleMediaChange = () => {
      applyResolvedTheme();
    };

    const handleStorage = (event) => {
      if (!event.key || event.key === "ss.theme") {
        applyResolvedTheme();
      }
    };

    window.addEventListener("storage", handleStorage);

    if (media?.addEventListener) {
      media.addEventListener("change", handleMediaChange);
    } else if (media?.addListener) {
      media.addListener(handleMediaChange);
    }

    return () => {
      window.removeEventListener("storage", handleStorage);

      if (media?.removeEventListener) {
        media.removeEventListener("change", handleMediaChange);
      } else if (media?.removeListener) {
        media.removeListener(handleMediaChange);
      }
    };
  }, [user?.preferences?.theme]);

  return null;
}

const App = () => {""",
    "App.jsx ThemeSync replacement",
)

app_text = replace_once(
    app_text,
    '<Router>\n                  <Suspense fallback={<LoadingSpinner />}>',
    '<Router>\n                  <ThemeSync />\n                  <Suspense fallback={<LoadingSpinner />}>',
    "App.jsx ThemeSync mount",
)

app_text = replace_once(
    app_text,
    'className="app-container w-full min-h-screen bg-slate-50 !rounded-none !m-0 !p-0 !border-0"',
    'className="app-container w-full min-h-screen bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-white transition-colors duration-300 !rounded-none !m-0 !p-0 !border-0"',
    "App.jsx app-container theme classes",
)

app_path.write_text(app_text, encoding="utf-8")
print(f"✅ patched {app_path}")


# ──────────────────────────────────────────────────────────────────────────────
# 4) Patch Settings.jsx applyTheme so system mode actually follows the OS
# ──────────────────────────────────────────────────────────────────────────────
settings_path = ROOT / "src/pages/Settings.jsx"
backup_file(settings_path)
settings_text = settings_path.read_text(encoding="utf-8")

settings_text = regex_replace_once(
    settings_text,
    r"  const applyTheme = \(mode\) => \{.*?\n  \};\n\n  // ═",
    """  const applyTheme = (mode) => {
    const root = document.documentElement;
    const media = window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : null;

    const applyResolvedTheme = (nextMode) => {
      const isDark =
        nextMode === "dark" ||
        (nextMode === "system" && Boolean(media?.matches));

      root.classList.toggle("dark", isDark);
      root.dataset.theme = isDark ? "dark" : "light";
      document.body.style.backgroundColor = isDark ? "#09090B" : "#F8FAFC";
    };

    if (mqlRef.current?.removeEventListener && mqlRef.current?._handler) {
      mqlRef.current.removeEventListener("change", mqlRef.current._handler);
      mqlRef.current = null;
    } else if (mqlRef.current?.removeListener && mqlRef.current?._handler) {
      mqlRef.current.removeListener(mqlRef.current._handler);
      mqlRef.current = null;
    }

    if (mode === "system" && media) {
      const handler = () => applyResolvedTheme("system");

      if (media.addEventListener) {
        media.addEventListener("change", handler);
      } else if (media.addListener) {
        media.addListener(handler);
      }

      media._handler = handler;
      mqlRef.current = media;
    }

    localStorage.setItem("ss.theme", mode);
    applyResolvedTheme(mode);
  };

  // ═""",
    "Settings.jsx applyTheme replacement",
)

settings_path.write_text(settings_text, encoding="utf-8")
print(f"✅ patched {settings_path}")

print("\\nDone. Restart Vite after this:")
print("  cd /Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
print("  npm run dev")
print("\\nBackups were saved in:")
print(f"  {BACKUP_ROOT}")
