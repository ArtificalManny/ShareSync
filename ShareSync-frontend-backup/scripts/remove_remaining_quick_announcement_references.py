#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import re
import sys

ROOT = Path.cwd()
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")

MANAGER = ROOT / "src/components/quick-actions/QuickActionsManager.jsx"
SHORTCUTS = ROOT / "src/components/quick-actions/KeyboardShortcuts.jsx"
INDEX = ROOT / "src/components/quick-actions/index.js"


def fail(message):
    print(f"\n[remove_remaining_quick_announcement_references] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def backup(path: Path):
    backup_path = path.with_name(f"{path.name}.bak-remove-remaining-quick-announcement-{STAMP}")
    backup_path.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")
    print(f"[remove_remaining_quick_announcement_references] backup created: {backup_path}")


def write_if_changed(path: Path, original: str, updated: str):
    if updated == original:
        print(f"[remove_remaining_quick_announcement_references] no changes needed: {path}")
        return False

    backup(path)
    path.write_text(updated, encoding="utf-8")
    print(f"[remove_remaining_quick_announcement_references] patched: {path}")
    return True


def patch_manager():
    if not MANAGER.exists():
        fail(f"Could not find {MANAGER}")

    original = MANAGER.read_text(encoding="utf-8")
    text = original

    required = [
        "QuickActionsManager",
        "QuickAnnounceFAB",
        "Quick Announcement",
    ]

    for marker in required:
        if marker not in text:
            print(f"[remove_remaining_quick_announcement_references] manager marker not found, skipping marker: {marker}")

    # Remove the stale JSX render that is causing:
    # QuickAnnounceFAB is not defined
    text = re.sub(
        r'\n\s*\{projectId\s*&&\s*<QuickAnnounceFAB\s+projectId=\{projectId\}\s*/>\}\s*',
        "\n",
        text,
        count=1,
    )

    # Remove any other direct QuickAnnounceFAB JSX usage, just in case formatting differs.
    text = re.sub(
        r'\n\s*<QuickAnnounceFAB\b[^>]*/>\s*',
        "\n",
        text,
        flags=re.MULTILINE,
    )

    # Remove the Cmd/Ctrl + Shift + A shortcut block that clicks the removed UI.
    text = re.sub(
        r'\n\s*//\s*Cmd/Ctrl\s*\+\s*Shift\s*\+\s*A\s+for\s+Quick Announcement\s*\n\s*if\s*\([^)]*key\.toLowerCase\(\)\s*===\s*[\'"]a[\'"][\s\S]*?document\.querySelector\(\s*[\'"]\[aria-label="Quick Announcement"\][\'"]\s*\)\?\.click\(\);\s*\n\s*\}\s*',
        "\n",
        text,
        count=1,
    )

    # Remove any import of QuickAnnounceFAB if one still exists.
    text = re.sub(
        r'^\s*import\s+QuickAnnounceFAB\s+from\s+[\'"][^\'"]*QuickAnnounceFAB[^\'"]*[\'"];\s*\n',
        "",
        text,
        flags=re.MULTILINE,
    )

    if "QuickAnnounceFAB" in text:
        fail("QuickAnnounceFAB still exists in QuickActionsManager.jsx after patch. No changes were written.")

    return write_if_changed(MANAGER, original, text)


def patch_shortcuts():
    if not SHORTCUTS.exists():
        print(f"[remove_remaining_quick_announcement_references] shortcuts file missing, skipped: {SHORTCUTS}")
        return False

    original = SHORTCUTS.read_text(encoding="utf-8")
    text = original

    # Remove the visible shortcut row:
    # { keys: ['⌘/Ctrl', 'Shift', 'A'], action: 'Quick Announcement', description: 'Post team update' },
    text = re.sub(
        r'\n\s*\{[^{}]*action:\s*[\'"]Quick Announcement[\'"][^{}]*\},?\s*',
        "\n",
        text,
        count=1,
    )

    if "Quick Announcement" in text:
        fail("Quick Announcement still exists in KeyboardShortcuts.jsx after patch. No changes were written.")

    return write_if_changed(SHORTCUTS, original, text)


def patch_index():
    if not INDEX.exists():
        print(f"[remove_remaining_quick_announcement_references] index file missing, skipped: {INDEX}")
        return False

    original = INDEX.read_text(encoding="utf-8")
    text = original

    text = re.sub(
        r'^\s*export\s+\{\s*default\s+as\s+QuickAnnounceFAB\s*\}\s+from\s+[\'"]\.\/QuickAnnounceFAB[\'"];\s*\n',
        "",
        text,
        flags=re.MULTILINE,
    )

    text = re.sub(
        r'^\s*export\s+\{\s*default\s+as\s+QuickAnnounceSheet\s*\}\s+from\s+[\'"]\.\/QuickAnnounceSheet[\'"];\s*\n',
        "",
        text,
        flags=re.MULTILINE,
    )

    if "QuickAnnounceFAB" in text or "QuickAnnounceSheet" in text:
        fail("QuickAnnounce export still exists in index.js after patch. No changes were written.")

    return write_if_changed(INDEX, original, text)


def main():
    print("[remove_remaining_quick_announcement_references] starting")

    changed = False
    changed = patch_manager() or changed
    changed = patch_shortcuts() or changed
    changed = patch_index() or changed

    if not changed:
        fail("No files were changed. Paste the current QuickActionsManager.jsx if the error remains.")

    print("")
    print("[remove_remaining_quick_announcement_references] done")
    print("")
    print("Next checks:")
    print('  rg -n "QuickAnnounceFAB|QuickAnnounceSheet|QuickAnnouncements|QuickAnnounce|Quick Announcement|quick-announce" src --glob "!*.bak*"')
    print("  npm run build")
    print("  git diff -- src/components/quick-actions")


if __name__ == "__main__":
    main()
