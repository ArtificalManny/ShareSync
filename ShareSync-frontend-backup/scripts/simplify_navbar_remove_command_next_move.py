#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import re
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
TARGET = ROOT / "src/components/Navbar.jsx"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[simplify_navbar_remove_command_next_move] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def main():
    print("[simplify_navbar_remove_command_next_move] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")
    original = source

    required_any = [
        "CommandCenterButton",
        "NextMoveButton",
        "NextMicroStep",
        "FocusModeToggle",
        "handleOpenCommandCenter",
        "handleOpenNextMove",
        "Start your day",
    ]

    if not any(marker in source for marker in required_any):
        print("[simplify_navbar_remove_command_next_move] navbar already appears simplified")
        return

    required_stable_markers = [
        "export default function Navbar({",
        "Quick Notes",
        "onOpenQuickNotes",
        "onOpenCreateProject",
        "NotificationCenter",
        "ProfileDropdown",
        "const handleSearch = (e) => {",
    ]

    for marker in required_stable_markers:
        if marker not in source:
            fail(f"Missing stable marker before patch: {marker}")

    # 1) Remove imports for removed controls.
    removable_imports = [
        'import NextMicroStep from "./navbar/NextMicroStep";\n',
        'import FocusModeToggle from "./navbar/FocusModeToggle";\n',
        'import SeasonBadge from "./navbar/SeasonBadge";\n',
    ]

    for imp in removable_imports:
        if imp in source:
            source = source.replace(imp, "")
            print(f"[simplify_navbar_remove_command_next_move] removed import: {imp.strip()}")

    # 2) Remove local CommandCenterButton and NextMoveButton components if present.
    source, command_removed = re.subn(
        r"\nconst CommandCenterButton = \(\{ onClick \}\) => \([\s\S]*?\n\);\n\nconst NextMoveButton = \(\{ onClick \}\) => \([\s\S]*?\n\);\n",
        "\n",
        source,
        count=1,
    )
    if command_removed:
        print("[simplify_navbar_remove_command_next_move] removed CommandCenterButton and NextMoveButton components")

    # 3) Remove handlers added for those buttons.
    source, handlers_removed = re.subn(
        r"\n  const handleOpenCommandCenter = \(\) => \{\n[\s\S]*?\n  \};\n\n  const handleOpenNextMove = \(\) => \{\n[\s\S]*?\n  \};\n",
        "\n",
        source,
        count=1,
    )
    if handlers_removed:
        print("[simplify_navbar_remove_command_next_move] removed command/next-move handlers")

    # 4) Shift remaining center nav features left instead of centered.
    old_center = '<div className="flex-1 flex items-center justify-center px-4">'
    new_center = '<div className="flex-1 flex items-center justify-start px-4">'
    if old_center in source:
        source = source.replace(old_center, new_center, 1)
        print("[simplify_navbar_remove_command_next_move] shifted center navbar tools left")

    # 5) Replace the whole xl center tool cluster with a clean minimal cluster.
    old_cluster_pattern = r'''            <div className="hidden xl:flex items-center gap-4 px-4 py-1\.5 transition-colors duration-200">
[\s\S]*?              <button
                type="button"
                onClick=\{onOpenQuickNotes\}
                className="inline-flex items-center gap-2 rounded-lg px-2\.5 py-1\.5 text-sm font-semibold text-slate-600 transition-all duration-200 hover:bg-white/70 hover:text-violet-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:text-zinc-300 dark:hover:bg-white/5 dark:hover:text-violet-300"
                title="Open Quick Notes"
              >
                <StickyNote className="h-4 w-4 text-violet-500 dark:text-violet-400" />
                <span>Quick Notes</span>
                <span className="inline-flex min-w-\[1\.25rem\] items-center justify-center rounded-full bg-violet-100 px-1\.5 py-0\.5 text-\[11px\] font-bold text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
                  \{quickNotesCount\}
                </span>
              </button>
            </div>'''

    new_cluster = '''            <div className="hidden xl:flex items-center gap-4 px-4 py-1.5 transition-colors duration-200">
              <TeamPresence />
              <div className="w-px h-4 bg-slate-200 dark:bg-white/10 transition-colors duration-200" />

              <button
                type="button"
                onClick={onOpenQuickNotes}
                className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-600 transition-all duration-200 hover:bg-white/70 hover:text-violet-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:text-zinc-300 dark:hover:bg-white/5 dark:hover:text-violet-300"
                title="Open Quick Notes"
              >
                <StickyNote className="h-4 w-4 text-violet-500 dark:text-violet-400" />
                <span>Quick Notes</span>
                <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-violet-100 px-1.5 py-0.5 text-[11px] font-bold text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
                  {quickNotesCount}
                </span>
              </button>
            </div>'''

    source, cluster_replaced = re.subn(old_cluster_pattern, new_cluster, source, count=1)

    if cluster_replaced:
        print("[simplify_navbar_remove_command_next_move] replaced center cluster with TeamPresence + Quick Notes")
    else:
        # Fallback: remove known individual elements if the cluster differs slightly.
        fallback_replacements = [
            '<CommandCenterButton onClick={handleOpenCommandCenter} />',
            '<NextMoveButton onClick={handleOpenNextMove} />',
            '<SeasonBadge />',
            '<NextMicroStep />',
        ]

        for item in fallback_replacements:
            if item in source:
                source = source.replace(item, "")
                print(f"[simplify_navbar_remove_command_next_move] removed fallback item: {item}")

        # Remove obvious doubled divider runs left by deletions.
        source = source.replace(
            '''              <div className="w-px h-4 bg-slate-200 dark:bg-white/10 transition-colors duration-200" />
              <div className="w-px h-4 bg-slate-200 dark:bg-white/10 transition-colors duration-200" />''',
            '''              <div className="w-px h-4 bg-slate-200 dark:bg-white/10 transition-colors duration-200" />''',
        )

    # 6) Remove FocusMode/NextMove right slot.
    removable_slots = [
        '<div className="hidden sm:block"><FocusModeToggle /></div>\n            <div className="h-5 w-px bg-slate-200 dark:bg-white/10 mx-1 hidden sm:block transition-colors duration-200" />\n\n',
        '<div className="hidden sm:block"><NextMoveButton onClick={handleOpenNextMove} /></div>\n            <div className="h-5 w-px bg-slate-200 dark:bg-white/10 mx-1 hidden sm:block transition-colors duration-200" />\n\n',
    ]

    for slot in removable_slots:
        if slot in source:
            source = source.replace(slot, "", 1)
            print("[simplify_navbar_remove_command_next_move] removed Focus/Next Move right-side slot")

    forbidden_after = [
        'import NextMicroStep from "./navbar/NextMicroStep";',
        'import FocusModeToggle from "./navbar/FocusModeToggle";',
        'import SeasonBadge from "./navbar/SeasonBadge";',
        "const CommandCenterButton",
        "const NextMoveButton",
        "handleOpenCommandCenter",
        "handleOpenNextMove",
        "<CommandCenterButton",
        "<NextMoveButton",
        "<NextMicroStep",
        "<FocusModeToggle",
        "<SeasonBadge",
        "openshare:command-center",
        "openshare:next-move",
        "Start your day",
        "Focus Mode",
        "Next Move",
        "Command Center",
    ]

    for marker in forbidden_after:
        if marker in source:
            fail(f"Safety check failed after patch. Old marker still present: {marker}")

    required_after = [
        "Quick Notes",
        "TeamPresence",
        "onOpenQuickNotes",
        "onOpenCreateProject",
        "NotificationCenter",
        "ProfileDropdown",
        'className="flex-1 flex items-center justify-start px-4"',
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    if source == original:
        print("[simplify_navbar_remove_command_next_move] no changes needed")
        return

    backup = TARGET.with_name(f"{TARGET.name}.bak-simplify-navbar-{STAMP}")
    backup.write_text(original, encoding="utf-8")
    print(f"[simplify_navbar_remove_command_next_move] backup created: {backup}")

    TARGET.write_text(source, encoding="utf-8")
    print(f"[simplify_navbar_remove_command_next_move] patched: {TARGET}")

    print("")
    print("[simplify_navbar_remove_command_next_move] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"Command Center|Start your day|Focus Mode|Next Move|CommandCenterButton|NextMoveButton|NextMicroStep|FocusModeToggle|SeasonBadge|Quick Notes|TeamPresence|justify-start\" src/components/Navbar.jsx -C 8")
    print("  git diff -- src/components/Navbar.jsx")


if __name__ == "__main__":
    main()
