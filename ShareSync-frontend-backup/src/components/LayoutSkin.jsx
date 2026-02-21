// src/components/LayoutSkin.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// LAYOUT SKIN - Theme Application Layer
// 
// This component applies the "Gallery Walk" theme to the entire app.
// It ensures:
// - Proper CSS variable scoping
// - Light mode for app pages
// - Dark mode for auth pages (via .auth-layout class)
// - Height normalization
//
// NO BACKEND CHANGES - This is purely visual theming.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect } from "react";

export default function LayoutSkin({ children, className = "" }) {
  // Apply height fix on mount
  useEffect(() => {
    // Ensure body doesn't have overflow issues
    document.body.style.minHeight = "100vh";
    document.body.style.height = "auto";
    
    // Add the light theme class to html element
    document.documentElement.classList.add("light-theme");
    
    console.log("✅ LayoutSkin applied - Gallery Walk theme active");
    
    return () => {
      document.documentElement.classList.remove("light-theme");
    };
  }, []);

  return (
    <div 
      className={`layout-skin min-h-screen ${className}`}
      style={{
        // Ensure proper stacking context
        isolation: "isolate",
        // Prevent layout shifts
        minHeight: "100vh",
        height: "auto"
      }}
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// THEME UTILITIES
// Helper functions for theme management
// ═══════════════════════════════════════════════════════════════════════════════

export function useTheme() {
  const [theme, setTheme] = React.useState("light");

  useEffect(() => {
    // Check for auth pages
    const isAuthPage = window.location.pathname.includes("/login") ||
                       window.location.pathname.includes("/create-account") ||
                       window.location.pathname.includes("/forgot-password") ||
                       window.location.pathname.includes("/reset-password");
    
    setTheme(isAuthPage ? "dark" : "light");
  }, []);

  return { theme, isLight: theme === "light", isDark: theme === "dark" };
}

// ═══════════════════════════════════════════════════════════════════════════════
// THEME PROVIDER (Optional - for more complex theme needs)
// ═══════════════════════════════════════════════════════════════════════════════

const ThemeContext = React.createContext({
  theme: "light",
  isLight: true,
  isDark: false
});

export function ThemeProvider({ children }) {
  const themeValue = useTheme();

  return (
    <ThemeContext.Provider value={themeValue}>
      <LayoutSkin>
        {children}
      </LayoutSkin>
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  return React.useContext(ThemeContext);
}
