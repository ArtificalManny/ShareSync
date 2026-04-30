#!/usr/bin/env python3
from pathlib import Path
import shutil
import sys

ROOT = Path.cwd()
TARGET = ROOT / "src/pages/Home.jsx"
BACKUP = ROOT / "src/pages/Home.jsx.bak.before-home-dark-mode-css-bridge"


def fail(message: str) -> None:
    print(f"\n[refine_home_dark_mode_css_bridge] ERROR: {message}")
    sys.exit(1)


def require_count(text: str, needle: str, expected: int, label: str) -> None:
    actual = text.count(needle)
    if actual != expected:
        fail(f"{label}: expected {expected} occurrence(s), found {actual}")


def optional_replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count == 0:
        print(f"[refine_home_dark_mode_css_bridge] skipped optional anchor: {label}")
        return text
    if count != 1:
        fail(f"{label}: expected 0 or 1 occurrence(s), found {count}")
    print(f"[refine_home_dark_mode_css_bridge] patched: {label}")
    return text.replace(old, new, 1)


def replace_once_required(text: str, old: str, new: str, label: str) -> str:
    require_count(text, old, 1, label)
    print(f"[refine_home_dark_mode_css_bridge] patched: {label}")
    return text.replace(old, new, 1)


def main() -> None:
    print("[refine_home_dark_mode_css_bridge] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")

    if "HOME DARK MODE POLISH BRIDGE" in source:
        fail("Home.jsx already appears to contain this dark-mode bridge. Refusing to patch twice.")

    edited = source

    # 1. Add a stable root class without depending on the exact current root class body.
    if "home-dark-polish-v2" not in edited:
        require_count(edited, 'className="home-page ', 1, "Home root className prefix")
        edited = edited.replace(
            'className="home-page ',
            'className="home-page home-dark-polish-v2 ',
            1,
        )
        print("[refine_home_dark_mode_css_bridge] patched: Home root dark polish class")

    # 2. Add/normalize section-surface class if the exact base string is present.
    edited = optional_replace_once(
        edited,
        'const base = "p-6 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 momentum-responsive-card momentum-card";',
        'const base = "home-section-surface p-6 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 momentum-responsive-card momentum-card";',
        "sectionCardClasses base gets home-section-surface",
    )

    # 3. If sectionCardClasses already got v5 styling, just ensure home-section-surface exists.
    edited = optional_replace_once(
        edited,
        'const base = "p-6 rounded-xl bg-white/95 dark:bg-[#121216]/95 border border-slate-200/80 dark:border-white/[0.08] momentum-responsive-card momentum-card";',
        'const base = "home-section-surface p-6 rounded-xl bg-white/95 dark:bg-[#121216]/95 border border-slate-200/80 dark:border-white/[0.08] momentum-responsive-card momentum-card";',
        "v5 sectionCardClasses base gets home-section-surface",
    )

    # 4. Wrap the pulse prompt if it is still in the original shape.
    if '<div className="home-pulse-shell' not in edited:
        original_pulse = """      <PulseCheckPrompt
        suggestedTask={missions?.[0]?.title || null}
        className="mb-6"
      />"""
        v5_pulse = """      <PulseCheckPrompt
        suggestedTask={missions?.[0]?.title || null}
        className="home-pulse-shell mb-6"
      />"""
        pulse_replacement = """      <div className="home-pulse-shell mb-6">
        <PulseCheckPrompt
          suggestedTask={missions?.[0]?.title || null}
          className="mb-0"
        />
      </div>"""

        if original_pulse in edited:
            edited = edited.replace(original_pulse, pulse_replacement, 1)
            print("[refine_home_dark_mode_css_bridge] patched: PulseCheckPrompt wrapper from original")
        elif v5_pulse in edited:
            edited = edited.replace(v5_pulse, pulse_replacement, 1)
            print("[refine_home_dark_mode_css_bridge] patched: PulseCheckPrompt wrapper from v5")
        else:
            print("[refine_home_dark_mode_css_bridge] skipped optional anchor: PulseCheckPrompt wrapper")

    # 5. Add home-focus-shell around YourMovesToday wrapper if still plain.
    edited = optional_replace_once(
        edited,
        """      <div className="mb-8">
        <YourMovesToday""",
        """      <div className="home-focus-shell mb-8">
        <YourMovesToday""",
        "YourMovesToday wrapper gets home-focus-shell",
    )

    # 6. Add right rail scope class.
    edited = optional_replace_once(
        edited,
        """        <div className="col-span-12 xl:col-span-4 space-y-6">""",
        """        <div className="home-right-rail col-span-12 xl:col-span-4 space-y-6">""",
        "right sidebar gets home-right-rail",
    )

    # 7. Add stat grid scope class.
    edited = optional_replace_once(
        edited,
        """            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">""",
        """            <div className="home-stat-grid grid grid-cols-2 md:grid-cols-4 gap-4">""",
        "velocity stat grid gets home-stat-grid",
    )

    # 8. Add CSS bridge before the existing animation keyframes.
    dark_css = """        /* HOME DARK MODE POLISH BRIDGE */
        html.dark .home-page.home-dark-polish-v2,
        html[data-theme="dark"] .home-page.home-dark-polish-v2,
        .dark .home-page.home-dark-polish-v2,
        [data-theme="dark"] .home-page.home-dark-polish-v2 {
          background:
            radial-gradient(circle at 15% 8%, rgba(124, 58, 237, 0.16), transparent 30%),
            radial-gradient(circle at 88% 72%, rgba(34, 211, 238, 0.075), transparent 30%),
            linear-gradient(180deg, #07090F 0%, #090B12 48%, #07090F 100%) !important;
          color: #F5F7FB !important;
          box-shadow: 0 0 0 100vmax #07090F;
          clip-path: inset(0 -100vmax);
        }

        html.dark .home-page.home-dark-polish-v2 .home-section-surface,
        html.dark .home-page.home-dark-polish-v2 .momentum-card,
        html.dark .home-page.home-dark-polish-v2 .card-surface,
        html[data-theme="dark"] .home-page.home-dark-polish-v2 .home-section-surface,
        html[data-theme="dark"] .home-page.home-dark-polish-v2 .momentum-card,
        html[data-theme="dark"] .home-page.home-dark-polish-v2 .card-surface,
        .dark .home-page.home-dark-polish-v2 .home-section-surface,
        .dark .home-page.home-dark-polish-v2 .momentum-card,
        .dark .home-page.home-dark-polish-v2 .card-surface,
        [data-theme="dark"] .home-page.home-dark-polish-v2 .home-section-surface,
        [data-theme="dark"] .home-page.home-dark-polish-v2 .momentum-card,
        [data-theme="dark"] .home-page.home-dark-polish-v2 .card-surface {
          background:
            linear-gradient(180deg, rgba(17, 19, 26, 0.96), rgba(13, 15, 21, 0.96)) !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
          color: #F5F7FB !important;
          box-shadow:
            0 18px 55px rgba(0, 0, 0, 0.30),
            inset 0 1px 0 rgba(255, 255, 255, 0.035) !important;
        }

        html.dark .home-page.home-dark-polish-v2 .home-pulse-shell,
        html.dark .home-page.home-dark-polish-v2 .home-pulse-shell [class*="bg-white"],
        html.dark .home-page.home-dark-polish-v2 .home-pulse-shell [class*="bg-slate-50"],
        html.dark .home-page.home-dark-polish-v2 .home-pulse-shell [class*="bg-violet-50"],
        html[data-theme="dark"] .home-page.home-dark-polish-v2 .home-pulse-shell,
        html[data-theme="dark"] .home-page.home-dark-polish-v2 .home-pulse-shell [class*="bg-white"],
        html[data-theme="dark"] .home-page.home-dark-polish-v2 .home-pulse-shell [class*="bg-slate-50"],
        html[data-theme="dark"] .home-page.home-dark-polish-v2 .home-pulse-shell [class*="bg-violet-50"],
        .dark .home-page.home-dark-polish-v2 .home-pulse-shell,
        .dark .home-page.home-dark-polish-v2 .home-pulse-shell [class*="bg-white"],
        .dark .home-page.home-dark-polish-v2 .home-pulse-shell [class*="bg-slate-50"],
        .dark .home-page.home-dark-polish-v2 .home-pulse-shell [class*="bg-violet-50"],
        [data-theme="dark"] .home-page.home-dark-polish-v2 .home-pulse-shell,
        [data-theme="dark"] .home-page.home-dark-polish-v2 .home-pulse-shell [class*="bg-white"],
        [data-theme="dark"] .home-page.home-dark-polish-v2 .home-pulse-shell [class*="bg-slate-50"],
        [data-theme="dark"] .home-page.home-dark-polish-v2 .home-pulse-shell [class*="bg-violet-50"] {
          background: rgba(23, 26, 34, 0.94) !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
          color: #E5E7EB !important;
          box-shadow: 0 12px 38px rgba(0, 0, 0, 0.20) !important;
        }

        html.dark .home-page.home-dark-polish-v2 .home-focus-shell [class*="bg-white"],
        html.dark .home-page.home-dark-polish-v2 .home-right-rail [class*="bg-white"],
        html.dark .home-page.home-dark-polish-v2 .home-stat-grid [class*="bg-white"],
        html.dark .home-page.home-dark-polish-v2 .home-focus-shell [class*="bg-slate-50"],
        html.dark .home-page.home-dark-polish-v2 .home-right-rail [class*="bg-slate-50"],
        html.dark .home-page.home-dark-polish-v2 .home-stat-grid [class*="bg-slate-50"],
        html[data-theme="dark"] .home-page.home-dark-polish-v2 .home-focus-shell [class*="bg-white"],
        html[data-theme="dark"] .home-page.home-dark-polish-v2 .home-right-rail [class*="bg-white"],
        html[data-theme="dark"] .home-page.home-dark-polish-v2 .home-stat-grid [class*="bg-white"],
        .dark .home-page.home-dark-polish-v2 .home-focus-shell [class*="bg-white"],
        .dark .home-page.home-dark-polish-v2 .home-right-rail [class*="bg-white"],
        .dark .home-page.home-dark-polish-v2 .home-stat-grid [class*="bg-white"],
        [data-theme="dark"] .home-page.home-dark-polish-v2 .home-focus-shell [class*="bg-white"],
        [data-theme="dark"] .home-page.home-dark-polish-v2 .home-right-rail [class*="bg-white"],
        [data-theme="dark"] .home-page.home-dark-polish-v2 .home-stat-grid [class*="bg-white"] {
          background: rgba(23, 26, 34, 0.94) !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
          color: #F5F7FB !important;
        }

        html.dark .home-page.home-dark-polish-v2 [class*="text-slate-800"],
        html.dark .home-page.home-dark-polish-v2 [class*="text-slate-900"],
        html[data-theme="dark"] .home-page.home-dark-polish-v2 [class*="text-slate-800"],
        html[data-theme="dark"] .home-page.home-dark-polish-v2 [class*="text-slate-900"],
        .dark .home-page.home-dark-polish-v2 [class*="text-slate-800"],
        .dark .home-page.home-dark-polish-v2 [class*="text-slate-900"],
        [data-theme="dark"] .home-page.home-dark-polish-v2 [class*="text-slate-800"],
        [data-theme="dark"] .home-page.home-dark-polish-v2 [class*="text-slate-900"] {
          color: #F5F7FB !important;
        }

        html.dark .home-page.home-dark-polish-v2 [class*="text-slate-500"],
        html.dark .home-page.home-dark-polish-v2 [class*="text-slate-600"],
        html[data-theme="dark"] .home-page.home-dark-polish-v2 [class*="text-slate-500"],
        html[data-theme="dark"] .home-page.home-dark-polish-v2 [class*="text-slate-600"],
        .dark .home-page.home-dark-polish-v2 [class*="text-slate-500"],
        .dark .home-page.home-dark-polish-v2 [class*="text-slate-600"],
        [data-theme="dark"] .home-page.home-dark-polish-v2 [class*="text-slate-500"],
        [data-theme="dark"] .home-page.home-dark-polish-v2 [class*="text-slate-600"] {
          color: #A7B0C0 !important;
        }

        html.dark .home-page.home-dark-polish-v2 [class*="text-slate-400"],
        html[data-theme="dark"] .home-page.home-dark-polish-v2 [class*="text-slate-400"],
        .dark .home-page.home-dark-polish-v2 [class*="text-slate-400"],
        [data-theme="dark"] .home-page.home-dark-polish-v2 [class*="text-slate-400"] {
          color: #7F889A !important;
        }

"""

    edited = replace_once_required(
        edited,
        "        @keyframes pulse-once {",
        dark_css + "        @keyframes pulse-once {",
        "insert Home dark CSS bridge before keyframes",
    )

    required_markers = [
        "home-dark-polish-v2",
        "HOME DARK MODE POLISH BRIDGE",
        "linear-gradient(180deg, #07090F 0%, #090B12 48%, #07090F 100%)",
        "box-shadow: 0 0 0 100vmax #07090F;",
        "clip-path: inset(0 -100vmax);",
    ]

    for marker in required_markers:
        if marker not in edited:
            fail(f"Prewrite verification failed. Missing marker: {marker}")

    if edited == source:
        fail("No changes were produced")

    if not BACKUP.exists():
        shutil.copy2(TARGET, BACKUP)
        print(f"[refine_home_dark_mode_css_bridge] backup created: {BACKUP}")
    else:
        print(f"[refine_home_dark_mode_css_bridge] backup already exists, preserved: {BACKUP}")

    TARGET.write_text(edited, encoding="utf-8")

    updated = TARGET.read_text(encoding="utf-8")
    for marker in required_markers:
        if marker not in updated:
            fail(f"Post-edit verification failed. Missing marker after write: {marker}")

    print("\n[refine_home_dark_mode_css_bridge] complete")
    print("\nNext checks:")
    print("  npm run build")
    print("  rg -n \"home-dark-polish-v2|home-section-surface|home-pulse-shell|home-focus-shell|home-right-rail|home-stat-grid|HOME DARK MODE POLISH BRIDGE|#07090F|#171A22\" src/pages/Home.jsx -C 6")
    print("  git diff -- src/pages/Home.jsx")


if __name__ == "__main__":
    main()
