// src/components/LayoutSkin.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// LAYOUT SKIN - Theme Application Layer
//
// Purpose:
// - Provide a stable shell wrapper for the whole app
// - Normalize height / stacking context
// - Do NOT force light mode
// - Leave theme authority to ThemeSync + CSS token layers
//
// NO BACKEND CHANGES
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect } from "react";

export default function LayoutSkin({ children, className = "" }) {
  useEffect(() => {
    const previousMinHeight = document.body.style.minHeight;
    const previousHeight = document.body.style.height;

    document.body.style.minHeight = "100vh";
    document.body.style.height = "auto";

    return () => {
      document.body.style.minHeight = previousMinHeight;
      document.body.style.height = previousHeight;
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
  const getTheme = () => {
    const root = document.documentElement;
    if (root.classList.contains("dark") || root.dataset.theme === "dark") {
      return "dark";
    }
    return "light";
  };

  const [theme, setTheme] = React.useState(getTheme);

  useEffect(() => {
    const syncTheme = () => setTheme(getTheme());

    syncTheme();

    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    const handleMedia = () => syncTheme();
    const handleStorage = (event) => {
      if (!event.key || event.key === "ss.theme") {
        syncTheme();
      }
    };

    window.addEventListener("storage", handleStorage);

    if (media?.addEventListener) {
      media.addEventListener("change", handleMedia);
    } else if (media?.addListener) {
      media.addListener(handleMedia);
    }

    return () => {
      window.removeEventListener("storage", handleStorage);

      if (media?.removeEventListener) {
        media.removeEventListener("change", handleMedia);
      } else if (media?.removeListener) {
        media.removeListener(handleMedia);
      }
    };
  }, []);

  return { theme, isLight: theme === "light", isDark: theme === "dark" };
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
