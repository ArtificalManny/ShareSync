#!/usr/bin/env python3
from pathlib import Path
import shutil
import sys

ROOT = Path.cwd()
TARGET = ROOT / "src/pages/Settings.jsx"
BACKUP = ROOT / "src/pages/Settings.jsx.bak.before-dark-mode-surface-refine"


def fail(message: str) -> None:
    print(f"\n[refine_settings_dark_mode_surfaces] ERROR: {message}")
    sys.exit(1)


def require_count(text: str, needle: str, expected: int, label: str) -> None:
    actual = text.count(needle)
    if actual != expected:
        fail(f"{label}: expected {expected} occurrence(s), found {actual}")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    require_count(text, old, 1, label)
    return text.replace(old, new, 1)


def replace_all_checked(text: str, old: str, new: str, expected: int, label: str) -> str:
    require_count(text, old, expected, label)
    return text.replace(old, new)


def main() -> None:
    print("[refine_settings_dark_mode_surfaces] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")

    if "settings-page-surface" in source:
        fail("Settings.jsx already appears to contain the dark-mode surface refinement. Refusing to patch twice.")

    edited = source

    # 1. Strengthen SectionCard surfaces.
    edited = replace_once(
        edited,
        """        danger
          ? 'bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20'
          : 'bg-white dark:bg-[#1f1f23] border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none'""",
        """        danger
          ? 'bg-red-50/90 dark:bg-[#1A0B0D] border-red-200/90 dark:border-red-500/25 shadow-sm dark:shadow-[0_18px_50px_rgba(127,29,29,0.18)]'
          : 'bg-white/95 dark:bg-[#121216] border-slate-200/80 dark:border-white/[0.08] shadow-sm dark:shadow-[0_18px_55px_rgba(0,0,0,0.25)]'""",
        "SectionCard surface classes",
    )

    # 2. Replace inline theme-controlled main surface with Tailwind light/dark surfaces.
    edited = replace_once(
        edited,
        """    <main className="min-h-screen px-6 py-12 transition-colors duration-300" style={{ backgroundColor: theme === "dark" ? "#09090B" : "#f8fafc", color: theme === "dark" ? "#ffffff" : "#0f172a" }}>""",
        """    <main className="settings-page-surface min-h-screen px-6 py-12 text-slate-900 transition-colors duration-300 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.08),transparent_30%),linear-gradient(180deg,#F8FAFC_0%,#EEF2FF_50%,#F8FAFC_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.16),transparent_32%),linear-gradient(180deg,#09090B_0%,#0F0F14_48%,#09090B_100%)] dark:text-white">""",
        "main settings page surface",
    )

    # 3. Improve collapsible setting row dark surfaces.
    edited = replace_all_checked(
        edited,
        """className="w-full flex items-center justify-between px-6 py-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1f1f23] shadow-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-colors\"""",
        """className="w-full flex items-center justify-between px-6 py-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/95 dark:bg-[#121216] shadow-sm dark:shadow-[0_18px_55px_rgba(0,0,0,0.22)] hover:bg-slate-50 dark:hover:bg-white/[0.045] transition-colors\"""",
        2,
        "advanced/power-user toggle surface classes",
    )

    # 4. Make the Appearance card icon less muddy in dark mode.
    edited = replace_once(
        edited,
        """            iconBg="bg-slate-200 dark:bg-zinc-800"
            iconColor="text-slate-600 dark:text-zinc-300\"""",
        """            iconBg="bg-slate-100 dark:bg-white/[0.06]"
            iconColor="text-slate-600 dark:text-zinc-300\"""",
        "Appearance icon colors",
    )

    # 5. Give Appearance its own controlled inner panel and stronger select surface.
    edited = replace_once(
        edited,
        """          >
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-zinc-300 mb-2 block">Theme</label>
              <select
                value={theme}
                onChange={(e) => {
                  setTheme(e.target.value);
                  applyTheme(e.target.value);
                }}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 px-4 py-3 text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >""",
        """          >
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/[0.08] dark:bg-[#0B0B0F]">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-zinc-300">Theme</label>
              <select
                value={theme}
                onChange={(e) => {
                  setTheme(e.target.value);
                  applyTheme(e.target.value);
                }}
                style={{ colorScheme: theme === "dark" ? "dark" : "light" }}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-white/[0.10] dark:bg-[#111116] dark:text-white dark:shadow-none dark:focus:border-violet-400"
              >""",
        "Appearance inner panel/select",
    )

    # 6. Strengthen phone/OTP input dark surfaces without changing logic.
    edited = replace_all_checked(
        edited,
        """bg-white dark:bg-black/20 text-slate-900 dark:text-white""",
        """bg-white dark:bg-[#0B0B0F] text-slate-900 dark:text-white""",
        2,
        "phone input and OTP dark surfaces",
    )

    # 7. Strengthen Danger Zone buttons.
    edited = replace_once(
        edited,
        """className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-white dark:bg-[#1f1f23] border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors font-medium shadow-sm dark:shadow-none\"""",
        """className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-white/90 dark:bg-[#120B0D] border border-red-200/90 dark:border-red-500/25 text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors font-medium shadow-sm dark:shadow-none\"""",
        "Danger Zone export button",
    )

    edited = replace_once(
        edited,
        """className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors font-medium\"""",
        """className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-red-50/90 dark:bg-red-500/10 border border-red-200/90 dark:border-red-500/25 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors font-medium\"""",
        "Danger Zone delete button",
    )

    required_markers = [
        "settings-page-surface",
        "dark:bg-[#121216]",
        "dark:bg-[#1A0B0D]",
        "style={{ colorScheme: theme === \"dark\" ? \"dark\" : \"light\" }}",
        "dark:bg-[#111116]",
        "dark:bg-[#120B0D]",
        "dark:shadow-[0_18px_55px_rgba(0,0,0,0.25)]",
    ]

    for marker in required_markers:
        if marker not in edited:
            fail(f"Prewrite verification failed. Missing marker: {marker}")

    if edited == source:
        fail("No changes were produced")

    if not BACKUP.exists():
        shutil.copy2(TARGET, BACKUP)
        print(f"[refine_settings_dark_mode_surfaces] backup created: {BACKUP}")
    else:
        print(f"[refine_settings_dark_mode_surfaces] backup already exists, preserved: {BACKUP}")

    TARGET.write_text(edited, encoding="utf-8")

    updated = TARGET.read_text(encoding="utf-8")
    for marker in required_markers:
        if marker not in updated:
            fail(f"Post-edit verification failed. Missing marker after write: {marker}")

    print("\n[refine_settings_dark_mode_surfaces] complete")
    print("\nNext checks:")
    print("  npm run build")
    print("  rg -n \"settings-page-surface|dark:bg-\\[#121216\\]|dark:bg-\\[#1A0B0D\\]|colorScheme|dark:bg-\\[#111116\\]|dark:bg-\\[#120B0D\\]|Danger Zone|Appearance\" src/pages/Settings.jsx -C 6")
    print("  git diff -- src/pages/Settings.jsx")


if __name__ == "__main__":
    main()
