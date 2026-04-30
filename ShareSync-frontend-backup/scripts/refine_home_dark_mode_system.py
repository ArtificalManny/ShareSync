#!/usr/bin/env python3
from pathlib import Path
import shutil
import sys

ROOT = Path.cwd()
TARGET = ROOT / "src/pages/Home.jsx"
BACKUP = ROOT / "src/pages/Home.jsx.bak.before-home-dark-mode-system"


def fail(message: str) -> None:
    print(f"\n[refine_home_dark_mode_system] ERROR: {message}")
    sys.exit(1)


def require_count(text: str, needle: str, expected: int, label: str) -> None:
    actual = text.count(needle)
    if actual != expected:
        fail(f"{label}: expected {expected} occurrence(s), found {actual}")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    require_count(text, old, 1, label)
    return text.replace(old, new, 1)


def main() -> None:
    print("[refine_home_dark_mode_system] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")

    if "HOME DARK MODE SYSTEM OVERRIDES" in source:
        fail("Home.jsx already appears to contain this dark-mode system patch. Refusing to patch twice.")

    edited = source

    # 1. StatCard card surface.
    edited = replace_once(
        edited,
        """        bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10
        hover:border-violet-200 dark:hover:border-violet-500/30""",
        """        bg-white/95 dark:bg-[#171A22]/95 border border-slate-200/80 dark:border-white/[0.08]
        hover:border-violet-200 dark:hover:border-violet-500/30""",
        "StatCard surface classes",
    )

    # 2. StatCard tooltip surface.
    edited = replace_once(
        edited,
        """            p-3 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 rounded-lg""",
        """            p-3 bg-white/95 dark:bg-[#171A22] border border-slate-200/80 dark:border-white/[0.08] rounded-lg""",
        "StatCard tooltip surface classes",
    )

    # 3. Section card base.
    edited = replace_once(
        edited,
        """    const base = "p-6 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 momentum-responsive-card momentum-card";""",
        """    const base = "home-section-surface p-6 rounded-xl bg-white/95 dark:bg-[#11131A]/95 border border-slate-200/80 dark:border-white/[0.08] momentum-responsive-card momentum-card";""",
        "sectionCardClasses base string",
    )

    # 4. Section card shadow.
    edited = replace_once(
        edited,
        """    const shadow = "shadow-[0_4px_24px_rgba(139,92,246,0.06)] hover:shadow-[0_8px_32px_rgba(139,92,246,0.12)]";""",
        """    const shadow = "shadow-[0_4px_24px_rgba(139,92,246,0.06)] hover:shadow-[0_8px_32px_rgba(139,92,246,0.12)] dark:shadow-[0_18px_55px_rgba(0,0,0,0.30)] dark:hover:shadow-[0_24px_70px_rgba(0,0,0,0.38)]";""",
        "sectionCardClasses shadow string",
    )

    # 5. Home root surface.
    edited = replace_once(
        edited,
        """    <div 
      className="home-page min-h-screen p-6 lg:p-10 max-w-[1600px] mx-auto" 
      data-momentum={glowLevel}
    >""",
        """    <div 
      className="home-page home-dark-system min-h-screen p-6 lg:p-10 max-w-[1600px] mx-auto text-slate-900 dark:text-[#F5F7FB] transition-colors duration-300" 
      data-momentum={glowLevel}
    >""",
        "Home root className",
    )

    # 6. Hero heading stronger dark-mode contrast.
    edited = replace_once(
        edited,
        """          <h1 className="text-4xl font-semibold text-slate-800 dark:text-zinc-100">""",
        """          <h1 className="home-hero-heading text-4xl font-semibold text-slate-800 dark:text-[#F5F7FB]">""",
        "Home hero heading className",
    )

    # 7. Greeting name contrast.
    edited = replace_once(
        edited,
        """            <span className={`${isFireMode ? "text-orange-500" : "text-violet-600 dark:text-zinc-500"} transition-colors duration-500`}>""",
        """            <span className={`${isFireMode ? "text-orange-500" : "text-violet-600 dark:text-zinc-200"} transition-colors duration-500`}>""",
        "Greeting name contrast",
    )

    # 8. Pulse prompt wrapper so we can control child white surfaces from Home safely.
    edited = replace_once(
        edited,
        """      <PulseCheckPrompt
        suggestedTask={missions?.[0]?.title || null}
        className="mb-6"
      />""",
        """      <div className="home-pulse-shell mb-6">
        <PulseCheckPrompt
          suggestedTask={missions?.[0]?.title || null}
          className="mb-0"
        />
      </div>""",
        "PulseCheckPrompt wrapper",
    )

    # 9. YourMovesToday wrapper so white inner rows become dark-mode tiles.
    edited = replace_once(
        edited,
        """      <div className="mb-8">
        <YourMovesToday""",
        """      <div className="home-focus-shell mb-8">
        <YourMovesToday""",
        "YourMovesToday wrapper",
    )

    # 10. Right rail wrapper to soften white child cards from Home level.
    edited = replace_once(
        edited,
        """        <div className="col-span-12 xl:col-span-4 space-y-6">""",
        """        <div className="home-right-rail col-span-12 xl:col-span-4 space-y-6">""",
        "Right rail wrapper",
    )

    # 11. Velocity metrics stat grid wrapper.
    edited = replace_once(
        edited,
        """            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">""",
        """            <div className="home-stat-grid grid grid-cols-2 md:grid-cols-4 gap-4">""",
        "Velocity stat grid wrapper",
    )

    # 12. Slide-out panel surface.
    edited = replace_once(
        edited,
        """          bg-white dark:bg-[#111113] border-l border-slate-200 dark:border-white/10""",
        """          bg-white/95 dark:bg-[#11131A] border-l border-slate-200/80 dark:border-white/[0.08]""",
        "Slide-out panel surface",
    )

    # 13. Local scoped CSS.
    edited = replace_once(
        edited,
        """      {/* Animations */}
      <style>{`
        @keyframes pulse-once {""",
        """      {/* Animations */}
      <style>{`
        /* HOME DARK MODE SYSTEM OVERRIDES */
        html.dark .home-page.home-dark-system,
        html[data-theme="dark"] .home-page.home-dark-system,
        .dark .home-page.home-dark-system,
        [data-theme="dark"] .home-page.home-dark-system {
          background:
            radial-gradient(circle at 16% 8%, rgba(124, 58, 237, 0.16), transparent 30%),
            radial-gradient(circle at 88% 72%, rgba(34, 211, 238, 0.075), transparent 30%),
            linear-gradient(180deg, #07090F 0%, #090B12 48%, #07090F 100%) !important;
          color: #F5F7FB;
          box-shadow: 0 0 0 100vmax #07090F;
          clip-path: inset(0 -100vmax);
        }

        html.dark .home-page.home-dark-system .home-hero-heading,
        html[data-theme="dark"] .home-page.home-dark-system .home-hero-heading,
        .dark .home-page.home-dark-system .home-hero-heading,
        [data-theme="dark"] .home-page.home-dark-system .home-hero-heading {
          color: #F5F7FB !important;
          text-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
        }

        html.dark .home-page.home-dark-system .home-section-surface,
        html[data-theme="dark"] .home-page.home-dark-system .home-section-surface,
        .dark .home-page.home-dark-system .home-section-surface,
        [data-theme="dark"] .home-page.home-dark-system .home-section-surface {
          background:
            linear-gradient(180deg, rgba(17, 19, 26, 0.96), rgba(13, 15, 21, 0.96)) !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
          box-shadow:
            0 18px 55px rgba(0, 0, 0, 0.30),
            inset 0 1px 0 rgba(255, 255, 255, 0.035) !important;
        }

        html.dark .home-page.home-dark-system .card-surface,
        html[data-theme="dark"] .home-page.home-dark-system .card-surface,
        .dark .home-page.home-dark-system .card-surface,
        [data-theme="dark"] .home-page.home-dark-system .card-surface {
          background: rgba(23, 26, 34, 0.94) !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
          color: #F5F7FB !important;
        }

        html.dark .home-page.home-dark-system .home-pulse-shell > *,
        html[data-theme="dark"] .home-page.home-dark-system .home-pulse-shell > *,
        .dark .home-page.home-dark-system .home-pulse-shell > *,
        [data-theme="dark"] .home-page.home-dark-system .home-pulse-shell > * {
          background: rgba(23, 26, 34, 0.92) !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
          color: #E5E7EB !important;
          box-shadow: 0 12px 38px rgba(0, 0, 0, 0.20) !important;
        }

        html.dark .home-page.home-dark-system .home-focus-shell [class*="bg-white"],
        html.dark .home-page.home-dark-system .home-right-rail [class*="bg-white"],
        html[data-theme="dark"] .home-page.home-dark-system .home-focus-shell [class*="bg-white"],
        html[data-theme="dark"] .home-page.home-dark-system .home-right-rail [class*="bg-white"],
        .dark .home-page.home-dark-system .home-focus-shell [class*="bg-white"],
        .dark .home-page.home-dark-system .home-right-rail [class*="bg-white"],
        [data-theme="dark"] .home-page.home-dark-system .home-focus-shell [class*="bg-white"],
        [data-theme="dark"] .home-page.home-dark-system .home-right-rail [class*="bg-white"] {
          background: rgba(23, 26, 34, 0.94) !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
          color: #F5F7FB !important;
        }

        html.dark .home-page.home-dark-system [class*="text-slate-800"],
        html.dark .home-page.home-dark-system [class*="text-slate-900"],
        html[data-theme="dark"] .home-page.home-dark-system [class*="text-slate-800"],
        html[data-theme="dark"] .home-page.home-dark-system [class*="text-slate-900"],
        .dark .home-page.home-dark-system [class*="text-slate-800"],
        .dark .home-page.home-dark-system [class*="text-slate-900"],
        [data-theme="dark"] .home-page.home-dark-system [class*="text-slate-800"],
        [data-theme="dark"] .home-page.home-dark-system [class*="text-slate-900"] {
          color: #F5F7FB !important;
        }

        html.dark .home-page.home-dark-system [class*="text-slate-500"],
        html.dark .home-page.home-dark-system [class*="text-slate-600"],
        html[data-theme="dark"] .home-page.home-dark-system [class*="text-slate-500"],
        html[data-theme="dark"] .home-page.home-dark-system [class*="text-slate-600"],
        .dark .home-page.home-dark-system [class*="text-slate-500"],
        .dark .home-page.home-dark-system [class*="text-slate-600"],
        [data-theme="dark"] .home-page.home-dark-system [class*="text-slate-500"],
        [data-theme="dark"] .home-page.home-dark-system [class*="text-slate-600"] {
          color: #A7B0C0 !important;
        }

        html.dark .home-page.home-dark-system [class*="text-slate-400"],
        html[data-theme="dark"] .home-page.home-dark-system [class*="text-slate-400"],
        .dark .home-page.home-dark-system [class*="text-slate-400"],
        [data-theme="dark"] .home-page.home-dark-system [class*="text-slate-400"] {
          color: #7F889A !important;
        }

        @keyframes pulse-once {""",
        "Home scoped dark CSS overrides",
    )

    required_markers = [
        "home-dark-system",
        "home-section-surface",
        "home-pulse-shell",
        "home-focus-shell",
        "home-right-rail",
        "home-stat-grid",
        "HOME DARK MODE SYSTEM OVERRIDES",
        "linear-gradient(180deg, #07090F 0%, #090B12 48%, #07090F 100%)",
        "box-shadow: 0 0 0 100vmax #07090F;",
        "clip-path: inset(0 -100vmax);",
        "dark:bg-[#11131A]/95",
        "dark:bg-[#171A22]/95",
    ]

    for marker in required_markers:
        if marker not in edited:
            fail(f"Prewrite verification failed. Missing marker: {marker}")

    if edited == source:
        fail("No changes were produced")

    if not BACKUP.exists():
        shutil.copy2(TARGET, BACKUP)
        print(f"[refine_home_dark_mode_system] backup created: {BACKUP}")
    else:
        print(f"[refine_home_dark_mode_system] backup already exists, preserved: {BACKUP}")

    TARGET.write_text(edited, encoding="utf-8")

    updated = TARGET.read_text(encoding="utf-8")
    for marker in required_markers:
        if marker not in updated:
            fail(f"Post-edit verification failed. Missing marker after write: {marker}")

    print("\n[refine_home_dark_mode_system] complete")
    print("\nNext checks:")
    print("  npm run build")
    print("  rg -n \"home-dark-system|home-section-surface|home-pulse-shell|home-focus-shell|home-right-rail|HOME DARK MODE SYSTEM OVERRIDES|#07090F|#11131A|#171A22\" src/pages/Home.jsx -C 6")
    print("  git diff -- src/pages/Home.jsx")


if __name__ == "__main__":
    main()
