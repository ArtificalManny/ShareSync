#!/usr/bin/env python3
from pathlib import Path
import shutil
import sys

ROOT = Path.cwd()
TARGET = ROOT / "src/components/Navbar.jsx"
BACKUP = ROOT / "src/components/Navbar.jsx.bak.before-dark-surface-refine"


def fail(message: str) -> None:
    print(f"\n[refine_navbar_dark_surface] ERROR: {message}")
    sys.exit(1)


def require_count(text: str, needle: str, expected: int, label: str) -> None:
    actual = text.count(needle)
    if actual != expected:
        fail(f"{label}: expected {expected} occurrence(s), found {actual}")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    require_count(text, old, 1, label)
    return text.replace(old, new, 1)


def main() -> None:
    print("[refine_navbar_dark_surface] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")

    if "navbar-dark-surface-refined" in source:
        fail("Navbar.jsx already appears to contain the dark navbar refinement. Refusing to patch twice.")

    edited = source

    old_glow_style = """  const navbarGlowStyle = useMemo(() => {
    if (isFireMode) {
      return {
        boxShadow:
          "0 1px 0 rgba(249, 115, 22, 0.1), 0 4px 20px rgba(249, 115, 22, 0.08)",
        borderColor: "rgba(249, 115, 22, 0.15)",
      };
    }

    if (glowLevel >= 4) {
      return {
        boxShadow:
          "0 1px 0 rgba(139, 92, 246, 0.08), 0 4px 20px rgba(139, 92, 246, 0.06)",
        borderColor: "rgba(139, 92, 246, 0.1)",
      };
    }

    if (glowLevel >= 3) {
      return {
        boxShadow: "0 1px 0 rgba(139, 92, 246, 0.04)",
      };
    }

    return {};
  }, [glowLevel, isFireMode]);"""

    new_glow_style = """  const navbarGlowStyle = useMemo(() => {
    const baseSurface = {
      background: isDarkMode
        ? "linear-gradient(90deg, rgba(9, 9, 11, 0.92) 0%, rgba(15, 15, 20, 0.88) 50%, rgba(9, 9, 11, 0.92) 100%)"
        : "rgba(255, 255, 255, 0.84)",
      borderColor: isDarkMode
        ? "rgba(255, 255, 255, 0.08)"
        : "rgba(226, 232, 240, 0.78)",
      boxShadow: isDarkMode
        ? "0 1px 0 rgba(255,255,255,0.04), 0 14px 34px rgba(0,0,0,0.18)"
        : "0 1px 0 rgba(226,232,240,0.85), 0 10px 28px rgba(15,23,42,0.04)",
      backdropFilter: "blur(18px)",
      WebkitBackdropFilter: "blur(18px)",
    };

    if (isFireMode) {
      return {
        ...baseSurface,
        boxShadow: isDarkMode
          ? "0 1px 0 rgba(249,115,22,0.18), 0 14px 34px rgba(0,0,0,0.2), 0 4px 20px rgba(249,115,22,0.10)"
          : "0 1px 0 rgba(249,115,22,0.12), 0 4px 20px rgba(249,115,22,0.08)",
        borderColor: "rgba(249, 115, 22, 0.18)",
      };
    }

    if (glowLevel >= 4) {
      return {
        ...baseSurface,
        boxShadow: isDarkMode
          ? "0 1px 0 rgba(139,92,246,0.18), 0 14px 34px rgba(0,0,0,0.2), 0 4px 20px rgba(139,92,246,0.10)"
          : "0 1px 0 rgba(139,92,246,0.10), 0 4px 20px rgba(139,92,246,0.06)",
        borderColor: "rgba(139, 92, 246, 0.16)",
      };
    }

    if (glowLevel >= 3) {
      return {
        ...baseSurface,
        boxShadow: isDarkMode
          ? "0 1px 0 rgba(139,92,246,0.12), 0 14px 34px rgba(0,0,0,0.18)"
          : "0 1px 0 rgba(139,92,246,0.06)",
      };
    }

    return baseSurface;
  }, [glowLevel, isDarkMode, isFireMode]);"""

    edited = replace_once(
        edited,
        old_glow_style,
        new_glow_style,
        "navbarGlowStyle block",
    )

    edited = replace_once(
        edited,
        """        className="navbar sticky top-0 z-40 h-14 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 px-4 lg:px-6 transition-all duration-500\"""",
        """        className="navbar navbar-dark-surface-refined sticky top-0 z-40 h-14 border-b border-slate-200/70 bg-white/85 px-4 text-slate-900 backdrop-blur-xl transition-all duration-500 dark:border-white/[0.08] dark:bg-[#09090B]/90 dark:text-zinc-100 lg:px-6\"""",
        "header className",
    )

    edited = replace_once(
        edited,
        """                className="bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-violet-400 dark:focus:border-violet-500 focus:bg-white dark:focus:bg-[#0F172A] focus:outline-none focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-500/20 w-52 focus:w-72 transition-all duration-300\"""",
        """                className="navbar-dark-search bg-white/55 border border-slate-200/70 rounded-lg pl-9 pr-4 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-300 hover:border-slate-300 hover:bg-white/75 focus:w-72 focus:border-violet-400 focus:bg-white/90 focus:ring-2 focus:ring-violet-100 dark:border-white/[0.08] dark:bg-white/[0.035] dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:hover:border-white/[0.14] dark:hover:bg-white/[0.06] dark:focus:border-violet-500/60 dark:focus:bg-white/[0.07] dark:focus:ring-violet-500/20 w-52\"""",
        "search input dark surface",
    )

    edited = replace_once(
        edited,
        """                className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-600 transition-all duration-200 hover:bg-white/70 hover:text-violet-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:text-zinc-300 dark:hover:bg-white/5 dark:hover:text-violet-300\"""",
        """                className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-600 transition-all duration-200 hover:bg-white/70 hover:text-violet-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:text-zinc-300 dark:hover:bg-white/[0.07] dark:hover:text-violet-300\"""",
        "quick notes hover dark surface",
    )

    required_markers = [
        "navbar-dark-surface-refined",
        "navbar-dark-search",
        "linear-gradient(90deg, rgba(9, 9, 11, 0.92)",
        "WebkitBackdropFilter",
        "isDarkMode, isFireMode",
        "dark:focus:bg-white/[0.07]",
    ]

    for marker in required_markers:
        if marker not in edited:
            fail(f"Prewrite verification failed. Missing marker: {marker}")

    if edited == source:
        fail("No changes were produced")

    if not BACKUP.exists():
        shutil.copy2(TARGET, BACKUP)
        print(f"[refine_navbar_dark_surface] backup created: {BACKUP}")
    else:
        print(f"[refine_navbar_dark_surface] backup already exists, preserved: {BACKUP}")

    TARGET.write_text(edited, encoding="utf-8")

    updated = TARGET.read_text(encoding="utf-8")
    for marker in required_markers:
        if marker not in updated:
            fail(f"Post-edit verification failed. Missing marker after write: {marker}")

    print("\n[refine_navbar_dark_surface] complete")
    print("\nNext checks:")
    print("  npm run build")
    print("  rg -n \"navbar-dark-surface-refined|navbar-dark-search|linear-gradient\\(90deg, rgba\\(9, 9, 11|WebkitBackdropFilter|isDarkMode, isFireMode|dark:focus:bg-white\" src/components/Navbar.jsx -C 6")
    print("  git diff -- src/components/Navbar.jsx")


if __name__ == "__main__":
    main()
