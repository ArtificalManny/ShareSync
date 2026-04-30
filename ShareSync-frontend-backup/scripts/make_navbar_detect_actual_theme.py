#!/usr/bin/env python3
from pathlib import Path
import shutil
import sys

ROOT = Path.cwd()
TARGET = ROOT / "src/components/Navbar.jsx"
BACKUP = ROOT / "src/components/Navbar.jsx.bak.before-theme-detection"


def fail(message: str) -> None:
    print(f"\n[make_navbar_detect_actual_theme] ERROR: {message}")
    sys.exit(1)


def require_count(text: str, needle: str, expected: int, label: str) -> None:
    actual = text.count(needle)
    if actual != expected:
        fail(f"{label}: expected {expected} occurrence(s), found {actual}")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    require_count(text, old, 1, label)
    return text.replace(old, new, 1)


def main() -> None:
    print("[make_navbar_detect_actual_theme] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")

    if "NAVBAR THEME DETECTION BRIDGE" in source:
        fail("Navbar.jsx already appears to contain the theme detection bridge. Refusing to patch twice.")

    edited = source

    edited = replace_once(
        edited,
        """  const [searchQuery, setSearchQuery] = useState("");
  const chat = typeof useChat === "function" ? useChat() : null;
  const unreadTotal = chat?.unreadTotal || 0;


  const { glowLevel, isFireMode } = useMomentumContext();""",
        """  const [searchQuery, setSearchQuery] = useState("");
  const chat = typeof useChat === "function" ? useChat() : null;
  const unreadTotal = chat?.unreadTotal || 0;

  // NAVBAR THEME DETECTION BRIDGE
  // App.jsx does not currently pass isDarkMode/toggleDarkMode into Navbar.
  // Detect the real active theme from <html> so the navbar follows Settings.jsx.
  const readDocumentDarkMode = () => {
    if (typeof document === "undefined") return Boolean(isDarkMode);

    const root = document.documentElement;
    const dataTheme = root.getAttribute("data-theme");
    const storedTheme =
      window.localStorage.getItem("theme") ||
      window.localStorage.getItem("openShareTheme") ||
      window.localStorage.getItem("sharesync-theme");

    return (
      root.classList.contains("dark") ||
      dataTheme === "dark" ||
      storedTheme === "dark" ||
      Boolean(isDarkMode)
    );
  };

  const [detectedDarkMode, setDetectedDarkMode] = useState(readDocumentDarkMode);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const syncTheme = () => {
      setDetectedDarkMode(readDocumentDarkMode());
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    window.addEventListener("storage", syncTheme);
    window.addEventListener("theme:toggled", syncTheme);

    return () => {
      observer.disconnect();
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("theme:toggled", syncTheme);
    };
  }, [isDarkMode]);

  const effectiveIsDarkMode = detectedDarkMode || Boolean(isDarkMode);

  const handleNavbarThemeToggle = () => {
    if (typeof toggleDarkMode === "function") {
      toggleDarkMode();
      return;
    }

    if (typeof document === "undefined") return;

    const root = document.documentElement;
    const nextTheme = effectiveIsDarkMode ? "light" : "dark";

    root.classList.toggle("dark", nextTheme === "dark");
    root.setAttribute("data-theme", nextTheme);
    window.localStorage.setItem("theme", nextTheme);
    setDetectedDarkMode(nextTheme === "dark");

    try {
      window.dispatchEvent(new CustomEvent("theme:toggled", { detail: { theme: nextTheme } }));
    } catch {}
  };


  const { glowLevel, isFireMode } = useMomentumContext();""",
        "theme detection bridge insertion",
    )

    edited = replace_once(
        edited,
        """  const navbarGlowStyle = useMemo(() => {
    if (isFireMode) {
      return {
        boxShadow:
          "0 1px 0 rgba(249, 115, 22, 0.16), 0 4px 20px rgba(249, 115, 22, 0.10)",
        borderColor: "rgba(249, 115, 22, 0.18)",
      };
    }

    if (glowLevel >= 4) {
      return {
        boxShadow:
          "0 1px 0 rgba(139, 92, 246, 0.14), 0 4px 20px rgba(139, 92, 246, 0.10)",
        borderColor: "rgba(139, 92, 246, 0.16)",
      };
    }

    if (glowLevel >= 3) {
      return {
        boxShadow: "0 1px 0 rgba(139, 92, 246, 0.08)",
      };
    }

    return {};
  }, [glowLevel, isFireMode]);""",
        """  const navbarGlowStyle = useMemo(() => {
    if (isFireMode) {
      return {
        boxShadow:
          "0 1px 0 rgba(249, 115, 22, 0.16), 0 4px 20px rgba(249, 115, 22, 0.10)",
        borderColor: "rgba(249, 115, 22, 0.18)",
      };
    }

    if (glowLevel >= 4) {
      return {
        boxShadow:
          "0 1px 0 rgba(139, 92, 246, 0.14), 0 4px 20px rgba(139, 92, 246, 0.10)",
        borderColor: "rgba(139, 92, 246, 0.16)",
      };
    }

    if (glowLevel >= 3) {
      return {
        boxShadow: "0 1px 0 rgba(139, 92, 246, 0.08)",
      };
    }

    return {};
  }, [glowLevel, isFireMode]);

  const navbarSurfaceStyle = useMemo(
    () => ({
      background: effectiveIsDarkMode
        ? "linear-gradient(90deg, rgba(9,9,11,0.94) 0%, rgba(15,15,20,0.91) 50%, rgba(9,9,11,0.94) 100%)"
        : "rgba(255,255,255,0.86)",
      borderColor: effectiveIsDarkMode
        ? "rgba(255,255,255,0.08)"
        : "rgba(226,232,240,0.78)",
      backdropFilter: "blur(18px)",
      WebkitBackdropFilter: "blur(18px)",
      ...navbarGlowStyle,
    }),
    [effectiveIsDarkMode, navbarGlowStyle]
  );""",
        "navbarSurfaceStyle insertion",
    )

    edited = replace_once(
        edited,
        """        style={navbarGlowStyle}""",
        """        style={navbarSurfaceStyle}""",
        "header style prop",
    )

    edited = replace_once(
        edited,
        """                onClick={toggleDarkMode}
                title={isDarkMode ? "Light mode" : "Dark mode"}
              >
                {isDarkMode ? (""",
        """                onClick={handleNavbarThemeToggle}
                title={effectiveIsDarkMode ? "Light mode" : "Dark mode"}
              >
                {effectiveIsDarkMode ? (""",
        "theme toggle button wiring",
    )

    required_markers = [
        "NAVBAR THEME DETECTION BRIDGE",
        "readDocumentDarkMode",
        "detectedDarkMode",
        "effectiveIsDarkMode",
        "handleNavbarThemeToggle",
        "navbarSurfaceStyle",
        "style={navbarSurfaceStyle}",
        "title={effectiveIsDarkMode ? \"Light mode\" : \"Dark mode\"}",
    ]

    for marker in required_markers:
        if marker not in edited:
            fail(f"Prewrite verification failed. Missing marker: {marker}")

    if not BACKUP.exists():
        shutil.copy2(TARGET, BACKUP)
        print(f"[make_navbar_detect_actual_theme] backup created: {BACKUP}")
    else:
        print(f"[make_navbar_detect_actual_theme] backup already exists, preserved: {BACKUP}")

    TARGET.write_text(edited, encoding="utf-8")

    updated = TARGET.read_text(encoding="utf-8")
    for marker in required_markers:
        if marker not in updated:
            fail(f"Post-edit verification failed. Missing marker after write: {marker}")

    print("\n[make_navbar_detect_actual_theme] complete")
    print("\nNext checks:")
    print("  npm run build")
    print("  rg -n \"NAVBAR THEME DETECTION BRIDGE|readDocumentDarkMode|effectiveIsDarkMode|handleNavbarThemeToggle|navbarSurfaceStyle|style=\\{navbarSurfaceStyle\\}\" src/components/Navbar.jsx -C 6")
    print("  git diff -- src/components/Navbar.jsx")


if __name__ == "__main__":
    main()
