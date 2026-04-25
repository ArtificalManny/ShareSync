#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import re
import sys

ROOT = Path.cwd()
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")

TARGETS = [
    ROOT / "src/components/quick-actions/QuickAnnounceFAB.jsx",
    ROOT / "src/components/quick-actions/QuickActionsFAB.jsx",
    ROOT / "src/components/quick-actions/QuickAnnounceSheet.jsx",
    ROOT / "src/components/quick-actions/QuickAnnouncements.jsx",
]

MANAGER = ROOT / "src/components/quick-actions/QuickActionsManager.jsx"


def fail(message):
    print(f"\n[disable_quick_announcement_ui] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def backup(path: Path):
    backup_path = path.with_name(f"{path.name}.bak-disable-quick-announcement-ui-{STAMP}")
    backup_path.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")
    print(f"[disable_quick_announcement_ui] backup created: {backup_path}")


def write_if_changed(path: Path, original: str, updated: str):
    if original == updated:
        print(f"[disable_quick_announcement_ui] no changes needed: {path}")
        return False

    backup(path)
    path.write_text(updated, encoding="utf-8")
    print(f"[disable_quick_announcement_ui] patched: {path}")
    return True


def disable_component_file(path: Path):
    if not path.exists():
        print(f"[disable_quick_announcement_ui] missing, skipped: {path}")
        return False

    original = path.read_text(encoding="utf-8")

    if "Quick Announcement" not in original and "QuickAnnounce" not in original and "quick-announce" not in original:
        print(f"[disable_quick_announcement_ui] no Quick Announcement markers, skipped: {path}")
        return False

    component_name = path.stem

    # Keep the module alive so existing imports do not break.
    # Return null so the launcher/sheet/FAB disappears visually.
    updated = f"""// {path.relative_to(ROOT)}
// Disabled intentionally.
// The Quick Announcement UI was removed from the visible app shell/project UI.
// Keeping this module as a no-op prevents broken imports while cleanup continues.

import React from "react";

export default function {component_name}() {{
  return null;
}}
"""

    return write_if_changed(path, original, updated)


def patch_manager():
    if not MANAGER.exists():
        print(f"[disable_quick_announcement_ui] manager not found, skipped: {MANAGER}")
        return False

    original = MANAGER.read_text(encoding="utf-8")
    text = original

    # Remove direct imports of Quick Announcement UI modules.
    text = re.sub(
        r'^\s*import\s+.*?(QuickAnnounce\w*|QuickAnnouncements|QuickActionsFAB).*?from\s+[\'"].*?(QuickAnnounce\w*|QuickAnnouncements|QuickActionsFAB).*?[\'"];\s*\n',
        "",
        text,
        flags=re.MULTILINE,
    )

    # Remove direct JSX usages of Quick Announcement components.
    text = re.sub(
        r'\n\s*<(?P<name>QuickAnnounce\w*|QuickAnnouncements|QuickActionsFAB)\b[^>]*/>\s*',
        "\n",
        text,
        flags=re.MULTILINE,
    )

    text = re.sub(
        r'\n\s*<(?P<name>QuickAnnounce\w*|QuickAnnouncements|QuickActionsFAB)\b[^>]*>[\s\S]*?</(?P=name)>\s*',
        "\n",
        text,
        flags=re.MULTILINE,
    )

    # If there is a small action object/card specifically labeled Quick Announcement,
    # remove only the object containing that label.
    text = re.sub(
        r'\n\s*\{[^{}]*(?:Quick Announcement|quick announcement)[^{}]*\},?\s*',
        "\n",
        text,
        flags=re.IGNORECASE | re.MULTILINE,
    )

    return write_if_changed(MANAGER, original, text)


def main():
    print("[disable_quick_announcement_ui] starting")

    changed = False

    # Disable the actual visual modules first.
    for target in TARGETS:
        changed = disable_component_file(target) or changed

    # Remove obvious manager-level mounts.
    changed = patch_manager() or changed

    if not changed:
        fail("No changes were made. The Quick Announcement launcher may be in a different file.")

    print("")
    print("[disable_quick_announcement_ui] done")
    print("")
    print("Next checks:")
    print('  rg -n "QuickAnnouncements|QuickAnnounce|Quick Announcement|quick-announce|QuickActionsFAB" src/components src/pages src/features src/hooks src/api')
    print("  npm run build")
    print("  git diff -- src/components/quick-actions")


if __name__ == "__main__":
    main()
