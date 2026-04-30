#!/usr/bin/env python3
from pathlib import Path
import shutil
import sys

ROOT = Path.cwd()
TARGET = ROOT / "src/pages/Home.jsx"
BACKUP = ROOT / "src/pages/Home.jsx.bak.before-home-dark-surface-v5-exact-live"


def fail(message: str) -> None:
    print(f"\n[refine_home_dark_surface_v5_exact_live] ERROR: {message}")
    sys.exit(1)


def require_count(text: str, needle: str, expected: int, label: str) -> None:
    actual = text.count(needle)
    if actual != expected:
        fail(f"{label}: expected {expected} occurrence(s), found {actual}")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    require_count(text, old, 1, label)
    return text.replace(old, new, 1)


def main() -> None:
    print("[refine_home_dark_surface_v5_exact_live] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")

    if "HOME DARK SURFACE LOCAL OVERRIDES" in source:
        fail("Home.jsx already appears to contain the dark surface refinement. Refusing to patch twice.")

    edited = source

    # 1. StatCard card surface.
    edited = replace_once(
        edited,
        """        bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10
        hover:border-violet-200 dark:hover:border-violet-500/30""",
        """        bg-white/95 dark:bg-[#121216]/95 border border-slate-200/80 dark:border-white/[0.08]
        hover:border-violet-200 dark:hover:border-violet-500/30""",
        "StatCard surface",
    )

    # 2. StatCard tooltip surface.
    edited = replace_once(
        edited,
        """            p-3 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 rounded-lg""",
        """            p-3 bg-white/95 dark:bg-[#121216] border border-slate-200/80 dark:border-white/[0.08] rounded-lg""",
        "StatCard tooltip surface",
    )

    # 3. SectionCard base string.
    edited = replace_once(
        edited,
        """"p-6 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 momentum-responsive-card momentum-card";""",
        """"home-section-surface p-6 rounded-xl bg-white/95 dark:bg-[#121216]/95 border border-slate-200/80 dark:border-white/[0.08] momentum-responsive-card momentum-card";""",
        "sectionCardClasses base string",
    )

    # 4. SectionCard shadow string.
    edited = replace_once(
        edited,
        """"shadow-[0_4px_24px_rgba(139,92,246,0.06)] hover:shadow-[0_8px_32px_rgba(139,92,246,0.12)]";""",
        """"shadow-[0_4px_24px_rgba(139,92,246,0.06)] hover:shadow-[0_8px_32px_rgba(139,92,246,0.12)] dark:shadow-[0_18px_55px_rgba(0,0,0,0.28)] dark:hover:shadow-[0_22px_65px_rgba(0,0,0,0.34)]";""",
        "sectionCardClasses shadow string",
    )

    # 5. Home root surface.
    edited = replace_once(
        edited,
        """      className="home-page min-h-screen p-6 lg:p-10 max-w-[1600px] mx-auto\"""",
        """      className="home-page home-dark-surface min-h-screen p-6 lg:p-10 max-w-[1600px] mx-auto text-slate-900 dark:text-zinc-100 transition-colors duration-300\"""",
        "Home root className",
    )

    # 6. Greeting name contrast.
    edited = replace_once(
        edited,
        """text-violet-600 dark:text-zinc-500""",
        """text-violet-600 dark:text-zinc-300""",
        "Greeting name contrast",
    )

    # 7. Pulse prompt shell.
    edited = replace_once(
        edited,
        """            <PulseCheckPrompt
              suggestedTask={missions?.[0]?.title || null}
              className="mb-0"
            />""",
        """            <PulseCheckPrompt
              suggestedTask={missions?.[0]?.title || null}
              className="home-pulse-shell mb-0"
            />""",
        "PulseCheckPrompt className",
    )

    # 8. Slide-out panel.
    edited = replace_once(
        edited,
        """          bg-white dark:bg-[#111113] border-l border-slate-200 dark:border-white/10""",
        """          bg-white/95 dark:bg-[#111113] border-l border-slate-200/80 dark:border-white/[0.08]""",
        "Slide-out panel surface",
    )

    # 9. Local scoped CSS. Full-bleed box-shadow matters because Home has max-width.
    edited = replace_once(
        edited,
        """      <style>{`
        @keyframes pulse-once {""",
        """      <style>{`
        /* HOME DARK SURFACE LOCAL OVERRIDES */
        html.dark .home-page.home-dark-surface,
        html[data-theme="dark"] .home-page.home-dark-surface,
        .dark .home-page.home-dark-surface,
        [data-theme="dark"] .home-page.home-dark-surface {
          background:
            radial-gradient(circle at top left, rgba(139, 92, 246, 0.12), transparent 34%),
            radial-gradient(circle at bottom right, rgba(20, 184, 166, 0.08), transparent 30%),
            linear-gradient(180deg, #09090B 0%, #0F0F14 42%, #09090B 100%) !important;
          color: #F8FAFC;
          box-shadow: 0 0 0 100vmax #09090B;
          clip-path: inset(0 -100vmax);
        }

        html.dark .home-page.home-dark-surface .home-section-surface,
        html[data-theme="dark"] .home-page.home-dark-surface .home-section-surface,
        .dark .home-page.home-dark-surface .home-section-surface,
        [data-theme="dark"] .home-page.home-dark-surface .home-section-surface {
          background: rgba(18, 18, 22, 0.95) !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
          box-shadow:
            0 18px 55px rgba(0, 0, 0, 0.28),
            inset 0 1px 0 rgba(255, 255, 255, 0.035) !important;
        }

        html.dark .home-page.home-dark-surface .home-pulse-shell,
        html[data-theme="dark"] .home-page.home-dark-surface .home-pulse-shell,
        .dark .home-page.home-dark-surface .home-pulse-shell,
        [data-theme="dark"] .home-page.home-dark-surface .home-pulse-shell {
          background: rgba(17, 17, 22, 0.72) !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
          color: #E5E7EB !important;
          box-shadow: 0 12px 38px rgba(0, 0, 0, 0.18) !important;
        }

        @keyframes pulse-once {""",
        "Home local CSS overrides",
    )

    required_markers = [
        "home-dark-surface",
        "home-section-surface",
        "home-pulse-shell",
        "HOME DARK SURFACE LOCAL OVERRIDES",
        "box-shadow: 0 0 0 100vmax #09090B;",
        "clip-path: inset(0 -100vmax);",
        "dark:text-zinc-300",
        "dark:bg-[#121216]/95",
    ]

    for marker in required_markers:
        if marker not in edited:
            fail(f"Prewrite verification failed. Missing marker: {marker}")

    if edited == source:
        fail("No changes were produced")

    if not BACKUP.exists():
        shutil.copy2(TARGET, BACKUP)
        print(f"[refine_home_dark_surface_v5_exact_live] backup created: {BACKUP}")
    else:
        print(f"[refine_home_dark_surface_v5_exact_live] backup already exists, preserved: {BACKUP}")

    TARGET.write_text(edited, encoding="utf-8")

    updated = TARGET.read_text(encoding="utf-8")
    for marker in required_markers:
        if marker not in updated:
            fail(f"Post-edit verification failed. Missing marker after write: {marker}")

    print("\n[refine_home_dark_surface_v5_exact_live] complete")
    print("\nNext checks:")
    print("  npm run build")
    print("  rg -n \"home-dark-surface|home-section-surface|home-pulse-shell|HOME DARK SURFACE LOCAL OVERRIDES|100vmax|clip-path|dark:text-zinc-300|#09090B\" src/pages/Home.jsx -C 6")
    print("  git diff -- src/pages/Home.jsx")


if __name__ == "__main__":
    main()
