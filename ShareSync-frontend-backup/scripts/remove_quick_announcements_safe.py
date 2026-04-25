#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import re
import sys

ROOT = Path.cwd()

QUICK_ANNOUNCEMENTS = ROOT / "src/components/quick-actions/QuickAnnouncements.jsx"
QUICK_ACTIONS_MANAGER_CANDIDATES = [
    ROOT / "src/components/quick-actions/QuickActionsManager.jsx",
    ROOT / "src/components/quick-actions/QuickActionsManager.js",
    ROOT / "src/components/quick-actions/QuickActionsManager.tsx",
    ROOT / "src/components/quick-actions/QuickActionsManager.ts",
]

SEARCH_EXTENSIONS = {".js", ".jsx", ".ts", ".tsx"}

BACKUP_STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str) -> None:
    print(f"\n[remove_quick_announcements_safe] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def backup_file(path: Path) -> None:
    backup = path.with_name(f"{path.name}.bak-remove-quick-announcements-{BACKUP_STAMP}")
    backup.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")
    print(f"[remove_quick_announcements_safe] backup created: {backup}")


def write_if_changed(path: Path, original: str, updated: str) -> bool:
    if updated == original:
        return False
    backup_file(path)
    path.write_text(updated, encoding="utf-8")
    print(f"[remove_quick_announcements_safe] patched: {path}")
    return True


def remove_imports_and_direct_jsx_usage(path: Path) -> bool:
    original = path.read_text(encoding="utf-8")
    text = original

    # Remove direct imports of the component.
    text = re.sub(
        r'^\s*import\s+[\w{}\s,*]+\s+from\s+[\'"][^\'"]*QuickAnnouncements[^\'"]*[\'"];\s*\n',
        "",
        text,
        flags=re.MULTILINE,
    )

    # Remove lazy imports of the component if any exist.
    text = re.sub(
        r'^\s*const\s+\w*(QuickAnnounce|QuickAnnouncement|QuickAnnouncements)\w*\s*=\s*lazy\(\s*\(\)\s*=>\s*import\([\'"][^\'"]*QuickAnnouncements[^\'"]*[\'"]\)[\s\S]*?\);\s*\n',
        "",
        text,
        flags=re.MULTILINE,
    )

    # Remove obvious direct JSX self-closing usages.
    text = re.sub(
        r'\n\s*<(?P<name>\w*(?:QuickAnnounce|QuickAnnouncement|QuickAnnouncements)\w*)\b[^>]*/>\s*',
        "\n",
        text,
        flags=re.MULTILINE,
    )

    # Remove obvious open/close JSX usages.
    text = re.sub(
        r'\n\s*<(?P<name>\w*(?:QuickAnnounce|QuickAnnouncement|QuickAnnouncements)\w*)\b[^>]*>[\s\S]*?</(?P=name)>\s*',
        "\n",
        text,
        flags=re.MULTILINE,
    )

    return write_if_changed(path, original, text)


def patch_quick_actions_manager(path: Path) -> bool:
    original = path.read_text(encoding="utf-8")
    text = original

    if "Quick Announcement" not in text and "QuickAnnouncements" not in text and "QuickAnnounce" not in text:
        return False

    # Remove direct import first.
    text = re.sub(
        r'^\s*import\s+[\w{}\s,*]+\s+from\s+[\'"][^\'"]*QuickAnnouncements[^\'"]*[\'"];\s*\n',
        "",
        text,
        flags=re.MULTILINE,
    )

    # Remove action objects/cards that clearly reference Quick Announcement.
    # This intentionally targets only blocks containing announcement wording.
    text = re.sub(
        r'\n\s*\{[^{}]*(?:Quick Announcement|Quick announcement|announcement|Announcement)[^{}]*(?:Megaphone|quickAnnounce|announce|Announcement)[^{}]*\},?\s*',
        "\n",
        text,
        flags=re.IGNORECASE | re.MULTILINE,
    )

    text = re.sub(
        r'\n\s*\{[^{}]*(?:Megaphone|quickAnnounce|announce|Announcement)[^{}]*(?:Quick Announcement|Quick announcement|announcement|Announcement)[^{}]*\},?\s*',
        "\n",
        text,
        flags=re.IGNORECASE | re.MULTILINE,
    )

    # Remove JSX sheet/component usage.
    text = re.sub(
        r'\n\s*<(?P<name>\w*(?:QuickAnnounce|QuickAnnouncement|QuickAnnouncements)\w*)\b[^>]*/>\s*',
        "\n",
        text,
        flags=re.MULTILINE,
    )

    text = re.sub(
        r'\n\s*<(?P<name>\w*(?:QuickAnnounce|QuickAnnouncement|QuickAnnouncements)\w*)\b[^>]*>[\s\S]*?</(?P=name)>\s*',
        "\n",
        text,
        flags=re.MULTILINE,
    )

    # Remove simple state hooks related to quick announcement if left behind.
    text = re.sub(
        r'^\s*const\s*\[\s*\w*(?:QuickAnnounce|Announcement|Announce)\w*\s*,\s*set\w*(?:QuickAnnounce|Announcement|Announce)\w*\s*\]\s*=\s*useState\([^)]*\);\s*\n',
        "",
        text,
        flags=re.IGNORECASE | re.MULTILINE,
    )

    # Clean import list if Megaphone is now unused.
    if "Megaphone" in text:
        body_without_imports = re.sub(r"^import[\s\S]*?;\n", "", text, flags=re.MULTILINE)
        if "Megaphone" not in body_without_imports:
            text = re.sub(r'\bMegaphone,\s*', "", text)
            text = re.sub(r',\s*Megaphone\b', "", text)

    return write_if_changed(path, original, text)


def collect_references() -> list[tuple[Path, list[str]]]:
    refs = []

    for path in (ROOT / "src").rglob("*"):
        if path.suffix not in SEARCH_EXTENSIONS:
            continue

        # Ignore backup files.
        if ".bak" in path.name:
            continue

        text = path.read_text(encoding="utf-8", errors="ignore")

        if path == QUICK_ANNOUNCEMENTS:
            continue

        hits = []
        for token in [
            "QuickAnnouncements",
            "QuickAnnounce",
            "Quick Announcement",
            "quick-announce",
            "components/quick-actions/QuickAnnouncements",
            "./QuickAnnouncements",
        ]:
            if token in text:
                hits.append(token)

        if hits:
            refs.append((path, hits))

    return refs


def maybe_delete_quick_announcements_file() -> None:
    refs = collect_references()

    if refs:
        print("")
        print("[remove_quick_announcements_safe] remaining references found; NOT deleting QuickAnnouncements.jsx yet:")
        for path, hits in refs:
            print(f"  - {path}: {', '.join(hits)}")
        print("")
        print("Paste these remaining references if you want the next script to remove them precisely.")
        return

    if QUICK_ANNOUNCEMENTS.exists():
        backup_file(QUICK_ANNOUNCEMENTS)
        QUICK_ANNOUNCEMENTS.unlink()
        print(f"[remove_quick_announcements_safe] deleted: {QUICK_ANNOUNCEMENTS}")

    index_candidates = [
        ROOT / "src/components/quick-actions/index.js",
        ROOT / "src/components/quick-actions/index.jsx",
        ROOT / "src/components/quick-actions/index.ts",
        ROOT / "src/components/quick-actions/index.tsx",
    ]

    for index_path in index_candidates:
        if not index_path.exists():
            continue

        original = index_path.read_text(encoding="utf-8")
        text = re.sub(
            r'^\s*export\s+.*QuickAnnouncements.*;\s*\n',
            "",
            original,
            flags=re.MULTILINE,
        )
        text = re.sub(
            r'^\s*export\s+.*QuickAnnounce.*;\s*\n',
            "",
            text,
            flags=re.MULTILINE,
        )
        write_if_changed(index_path, original, text)


def main() -> None:
    print("[remove_quick_announcements_safe] starting")

    if not QUICK_ANNOUNCEMENTS.exists():
        print(f"[remove_quick_announcements_safe] QuickAnnouncements file does not exist: {QUICK_ANNOUNCEMENTS}")
    else:
        print(f"[remove_quick_announcements_safe] found component: {QUICK_ANNOUNCEMENTS}")

    changed_any = False

    # Patch manager first because this is likely where the tiny launcher icon lives.
    manager_found = False
    for manager in QUICK_ACTIONS_MANAGER_CANDIDATES:
        if manager.exists():
            manager_found = True
            if patch_quick_actions_manager(manager):
                changed_any = True

    if not manager_found:
        print("[remove_quick_announcements_safe] QuickActionsManager file not found in expected locations.")

    # Remove direct imports/usages elsewhere.
    for path in (ROOT / "src").rglob("*"):
        if path.suffix not in SEARCH_EXTENSIONS:
            continue
        if ".bak" in path.name:
            continue
        if path == QUICK_ANNOUNCEMENTS:
            continue

        text = path.read_text(encoding="utf-8", errors="ignore")
        if "QuickAnnouncements" in text or "QuickAnnounce" in text or "Quick Announcement" in text:
            if remove_imports_and_direct_jsx_usage(path):
                changed_any = True

    maybe_delete_quick_announcements_file()

    print("")
    print("[remove_quick_announcements_safe] done")
    print("")
    print("Next checks:")
    print('  rg -n "QuickAnnouncements|QuickAnnounce|Quick Announcement|quick-announce|Megaphone" src/components src/pages src/features src/hooks src/api')
    print("  npm run build")
    print("  git diff -- src/components/quick-actions src/pages/ProjectHome.jsx")


if __name__ == "__main__":
    main()
