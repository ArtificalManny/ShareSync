#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import re
import sys

ROOT = Path.cwd()
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")

SEARCH_DIRS = [
    ROOT / "src/components",
    ROOT / "src/pages",
    ROOT / "src/features",
    ROOT / "src/hooks",
]

EXTENSIONS = {".js", ".jsx", ".ts", ".tsx"}

TARGET_TOKENS = [
    "QuickAnnounceFAB",
    "QuickAnnounceSheet",
    "QuickAnnouncements",
    "QuickAnnounce",
]


def fail(message):
    print(f"\n[fix_quick_announce_fab_undefined] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def backup(path: Path):
    backup_path = path.with_name(f"{path.name}.bak-fix-quick-announce-undefined-{STAMP}")
    backup_path.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")
    print(f"[fix_quick_announce_fab_undefined] backup created: {backup_path}")


def write_if_changed(path: Path, original: str, updated: str):
    if updated == original:
        return False

    backup(path)
    path.write_text(updated, encoding="utf-8")
    print(f"[fix_quick_announce_fab_undefined] patched: {path}")
    return True


def patch_file(path: Path):
    original = path.read_text(encoding="utf-8", errors="ignore")
    text = original

    if not any(token in text for token in TARGET_TOKENS):
        return False

    # 1. Remove import lines for Quick Announcement/FAB modules.
    text = re.sub(
        r'^\s*import\s+.*?(QuickAnnounceFAB|QuickAnnounceSheet|QuickAnnouncements|QuickAnnounce).*?from\s+[\'"][^\'"]*(QuickAnnounceFAB|QuickAnnounceSheet|QuickAnnouncements|QuickAnnounce)[^\'"]*[\'"];\s*\n',
        "",
        text,
        flags=re.MULTILINE,
    )

    # 2. Remove self-closing JSX usage:
    #    <QuickAnnounceFAB ... />
    #    <QuickAnnounceSheet ... />
    #    <QuickAnnouncements ... />
    text = re.sub(
        r'\n\s*<(QuickAnnounceFAB|QuickAnnounceSheet|QuickAnnouncements|QuickAnnounce)\b[^>]*/>\s*',
        "\n",
        text,
        flags=re.MULTILINE,
    )

    # 3. Remove open/close JSX usage:
    #    <QuickAnnounceFAB>...</QuickAnnounceFAB>
    text = re.sub(
        r'\n\s*<(?P<name>QuickAnnounceFAB|QuickAnnounceSheet|QuickAnnouncements|QuickAnnounce)\b[^>]*>[\s\S]*?</(?P=name)>\s*',
        "\n",
        text,
        flags=re.MULTILINE,
    )

    # 4. Remove state hooks that only controlled the quick announcement UI.
    text = re.sub(
        r'^\s*const\s*\[\s*\w*(QuickAnnounce|Announce|Announcement)\w*\s*,\s*set\w*(QuickAnnounce|Announce|Announcement)\w*\s*\]\s*=\s*useState\([^)]*\);\s*\n',
        "",
        text,
        flags=re.IGNORECASE | re.MULTILINE,
    )

    # 5. Remove simple handlers whose name is clearly announcement-only.
    text = re.sub(
        r'\n\s*const\s+\w*(QuickAnnounce|Announce|Announcement)\w*\s*=\s*\([^)]*\)\s*=>\s*\{[\s\S]*?\n\s*\};\s*',
        "\n",
        text,
        flags=re.IGNORECASE | re.MULTILINE,
    )

    # 6. Remove tiny action/card objects labeled Quick Announcement if present.
    text = re.sub(
        r'\n\s*\{[^{}]*(Quick Announcement|quick announcement)[^{}]*\},?\s*',
        "\n",
        text,
        flags=re.IGNORECASE | re.MULTILINE,
    )

    # 7. If an import from lucide-react now has Megaphone unused, remove it from that import.
    if "Megaphone" in text:
        non_import_body = re.sub(r'^import\s+[\s\S]*?;\s*$', "", text, flags=re.MULTILINE)
        if "Megaphone" not in non_import_body:
            text = re.sub(r'\bMegaphone,\s*', "", text)
            text = re.sub(r',\s*Megaphone\b', "", text)

    return write_if_changed(path, original, text)


def main():
    print("[fix_quick_announce_fab_undefined] starting")

    changed = False
    scanned = 0

    for base in SEARCH_DIRS:
        if not base.exists():
            continue

        for path in base.rglob("*"):
            if path.suffix not in EXTENSIONS:
                continue

            if ".bak" in path.name:
                continue

            scanned += 1
            if patch_file(path):
                changed = True

    print(f"[fix_quick_announce_fab_undefined] scanned files: {scanned}")

    if not changed:
        fail("No files were changed. Run the rg command below and paste the output.")

    print("")
    print("[fix_quick_announce_fab_undefined] done")
    print("")
    print("Next checks:")
    print('  rg -n "QuickAnnounceFAB|QuickAnnounceSheet|QuickAnnouncements|QuickAnnounce|Quick Announcement|quick-announce" src/components src/pages src/features src/hooks src/api')
    print("  npm run build")
    print("  git diff -- src/components/quick-actions src/pages")


if __name__ == "__main__":
    main()
