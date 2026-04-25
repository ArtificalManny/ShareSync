#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import re
import sys

ROOT = Path.cwd()
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")

QUICK_ACTIONS_DIR = ROOT / "src/components/quick-actions"

# We keep these files as no-op modules first so any remaining imports do not crash.
NOOP_COMPONENT_FILES = [
    QUICK_ACTIONS_DIR / "QuickShipFAB.jsx",
    QUICK_ACTIONS_DIR / "QuickShipModal.jsx",
    QUICK_ACTIONS_DIR / "QuickShipSheet.jsx",
    QUICK_ACTIONS_DIR / "QuickShipButton.jsx",
    QUICK_ACTIONS_DIR / "QuickShipToast.jsx",
]

PATCH_CANDIDATES = [
    QUICK_ACTIONS_DIR / "QuickActionsManager.jsx",
    QUICK_ACTIONS_DIR / "QuickActionsFAB.jsx",
    QUICK_ACTIONS_DIR / "KeyboardShortcuts.jsx",
    QUICK_ACTIONS_DIR / "index.js",
]

SEARCH_EXTENSIONS = {".js", ".jsx", ".ts", ".tsx"}

NOOP_TEMPLATE = """// {relative_path}
// Disabled intentionally.
// Quick Ship UI was removed from the visible project shell.
// Keeping this module as a no-op prevents broken imports while cleanup continues.

import React from "react";

export default function {component_name}() {{
  return null;
}}
"""


def fail(message: str) -> None:
    print(f"\\n[disable_quick_ship_ui_safe] ERROR: {message}\\n", file=sys.stderr)
    sys.exit(1)


def backup(path: Path) -> None:
    backup_path = path.with_name(f"{path.name}.bak-disable-quick-ship-ui-{STAMP}")
    backup_path.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")
    print(f"[disable_quick_ship_ui_safe] backup created: {backup_path}")


def write_if_changed(path: Path, original: str, updated: str) -> bool:
    if original == updated:
        print(f"[disable_quick_ship_ui_safe] no changes needed: {path}")
        return False

    backup(path)
    path.write_text(updated, encoding="utf-8")
    print(f"[disable_quick_ship_ui_safe] patched: {path}")
    return True


def disable_component_file(path: Path) -> bool:
    if not path.exists():
        print(f"[disable_quick_ship_ui_safe] missing, skipped: {path}")
        return False

    original = path.read_text(encoding="utf-8")

    if "Disabled intentionally" in original and "Quick Ship UI was removed" in original:
        print(f"[disable_quick_ship_ui_safe] already disabled: {path}")
        return False

    component_name = path.stem
    updated = NOOP_TEMPLATE.format(
        relative_path=path.relative_to(ROOT),
        component_name=component_name,
    )

    return write_if_changed(path, original, updated)


def patch_quick_ship_references(path: Path) -> bool:
    if not path.exists():
        print(f"[disable_quick_ship_ui_safe] missing, skipped: {path}")
        return False

    original = path.read_text(encoding="utf-8")
    text = original

    if "QuickShip" not in text and "Quick Ship" not in text and "quick-ship" not in text and "Ship Update" not in text:
        print(f"[disable_quick_ship_ui_safe] no Quick Ship markers, skipped: {path}")
        return False

    # Remove visible JSX mounts of QuickShip components.
    # This prevents hidden state from opening no-op overlays and cleans the UI path.
    text = re.sub(
        r'\\n\\s*\\{[^\\n{}]*&&\\s*<QuickShip(?:FAB|Modal|Sheet|Button|Toast)\\b[^>]*/>\\s*\\}\\s*',
        "\\n",
        text,
        flags=re.MULTILINE,
    )

    text = re.sub(
        r'\\n\\s*<QuickShip(?:FAB|Modal|Sheet|Button|Toast)\\b[^>]*/>\\s*',
        "\\n",
        text,
        flags=re.MULTILINE,
    )

    text = re.sub(
        r'\\n\\s*<(?P<name>QuickShip(?:FAB|Modal|Sheet|Button|Toast))\\b[^>]*>[\\s\\S]*?</(?P=name)>\\s*',
        "\\n",
        text,
        flags=re.MULTILINE,
    )

    # Remove keyboard shortcut rows or handlers that specifically target Quick Ship.
    text = re.sub(
        r'\\n\\s*\\{[^{}]*(?:Quick Ship|Ship Update)[^{}]*\\},?\\s*',
        "\\n",
        text,
        flags=re.IGNORECASE | re.MULTILINE,
    )

    text = re.sub(
        r'\\n\\s*//\\s*.*Quick Ship.*\\n\\s*if\\s*\\([^)]*\\)[\\s\\S]*?\\}\\s*',
        "\\n",
        text,
        count=1,
        flags=re.IGNORECASE | re.MULTILINE,
    )

    # Remove export lines from index.js only.
    if path.name == "index.js":
        text = re.sub(
            r'^\\s*export\\s+\\{\\s*default\\s+as\\s+QuickShip(?:FAB|Modal|Sheet|Button|Toast)\\s*\\}\\s+from\\s+[\\'"]\\.\\/QuickShip(?:FAB|Modal|Sheet|Button|Toast)[\\'"];\\s*\\n',
            "",
            text,
            flags=re.MULTILINE,
        )

    # Remove import lines only if no same component usage remains afterward.
    # This prevents the previous undefined-component crash pattern.
    for component in ["QuickShipFAB", "QuickShipModal", "QuickShipSheet", "QuickShipButton", "QuickShipToast"]:
        if component not in text:
            text = re.sub(
                rf'^\\s*import\\s+{component}\\s+from\\s+[\\'"][^\\'"]*{component}[^\\'"]*[\\'"];\\s*\\n',
                "",
                text,
                flags=re.MULTILINE,
            )

    return write_if_changed(path, original, text)


def print_remaining_refs() -> None:
    print("")
    print("[disable_quick_ship_ui_safe] remaining non-backup references:")
    found = False

    for base in [ROOT / "src/components", ROOT / "src/pages", ROOT / "src/features", ROOT / "src/hooks", ROOT / "src/api"]:
        if not base.exists():
            continue

        for path in base.rglob("*"):
            if path.suffix not in SEARCH_EXTENSIONS:
                continue
            if ".bak" in path.name:
                continue

            text = path.read_text(encoding="utf-8", errors="ignore")

            hits = []
            for token in [
                "QuickShipFAB",
                "QuickShipModal",
                "QuickShipSheet",
                "QuickShipButton",
                "QuickShipToast",
                "Quick Ship",
                "quick-ship",
            ]:
                if token in text:
                    hits.append(token)

            if hits:
                found = True
                print(f"  - {path.relative_to(ROOT)}: {', '.join(hits)}")

    if not found:
        print("  none")


def main() -> None:
    print("[disable_quick_ship_ui_safe] starting")

    if not QUICK_ACTIONS_DIR.exists():
        fail(f"Could not find quick-actions directory: {QUICK_ACTIONS_DIR}")

    changed = False

    # First: make every QuickShip visual module safe/no-op.
    for path in NOOP_COMPONENT_FILES:
        changed = disable_component_file(path) or changed

    # Second: remove obvious launcher/sheet/shortcut mounts where they are easy to identify.
    for path in PATCH_CANDIDATES:
        changed = patch_quick_ship_references(path) or changed

    if not changed:
        fail("No changes were made. Run the rg command below and paste output.")

    print_remaining_refs()

    print("")
    print("[disable_quick_ship_ui_safe] done")
    print("")
    print("Next checks:")
    print('  rg -n "QuickShipFAB|QuickShipModal|QuickShipSheet|QuickShipButton|QuickShipToast|Quick Ship|quick-ship" src --glob "!*.bak*"')
    print("  npm run build")
    print("  git diff -- src/components/quick-actions")


if __name__ == "__main__":
    main()
