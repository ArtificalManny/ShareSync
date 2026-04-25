#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path.cwd()
FAB = ROOT / "src/components/quick-actions/QuickShipFAB.jsx"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")

NOOP_FAB = """// src/components/quick-actions/QuickShipFAB.jsx
// Disabled intentionally.
// The visible Quick Ship floating action button has been removed from the project UI.
// Keeping this component as a no-op prevents broken imports while preserving the rest
// of the quick-actions system for future cleanup or reuse.

import React from 'react';

const QuickShipFAB = () => {
  return null;
};

export default QuickShipFAB;
"""


def fail(message):
    print(f"\\n[disable_quick_ship_fab_only] ERROR: {message}\\n", file=sys.stderr)
    sys.exit(1)


def main():
    print("[disable_quick_ship_fab_only] starting")

    if not FAB.exists():
        fail(f"Could not find {FAB}")

    source = FAB.read_text(encoding="utf-8")

    required_before = [
        "QuickShipFAB",
        "QuickShipModal",
        "QuickShipSheet",
        'aria-label="Quick Ship"',
        "Log a win in 5 seconds",
    ]

    already_disabled = (
        "Disabled intentionally" in source
        and "return null" in source
        and "Quick Ship floating action button" in source
    )

    if already_disabled:
        print("[disable_quick_ship_fab_only] QuickShipFAB is already disabled")
        return

    for marker in required_before:
        if marker not in source:
            fail(f"Safety stop: expected marker missing before patch: {marker}. No changes were written.")

    backup = FAB.with_name(f"{FAB.name}.bak-disable-quick-ship-fab-{STAMP}")
    backup.write_text(source, encoding="utf-8")
    print(f"[disable_quick_ship_fab_only] backup created: {backup}")

    FAB.write_text(NOOP_FAB, encoding="utf-8")
    print(f"[disable_quick_ship_fab_only] patched: {FAB}")

    print("")
    print("Next checks:")
    print('  rg -n "QuickShipFAB|QuickShipModal|QuickShipSheet|Quick Ship|aria-label=\\\"Quick Ship\\\"|Log a win in 5 seconds" src/components/quick-actions src/pages --glob "!*.bak*"')
    print("  npm run build")
    print("  git diff -- src/components/quick-actions/QuickShipFAB.jsx")


if __name__ == "__main__":
    main()
