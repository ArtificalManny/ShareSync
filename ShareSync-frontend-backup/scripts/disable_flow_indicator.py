#!/usr/bin/env python3
from pathlib import Path
import shutil
import sys

ROOT = Path.cwd()
TARGET = ROOT / "src/components/flow/FlowIndicator.jsx"
BACKUP = ROOT / "src/components/flow/FlowIndicator.jsx.bak.before-disable-flow-indicator"


def fail(message: str) -> None:
    print(f"\n[disable_flow_indicator] ERROR: {message}")
    sys.exit(1)


def main() -> None:
    print("[disable_flow_indicator] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")

    if "FLOW INDICATOR DISABLED" in source:
        fail("FlowIndicator.jsx already appears to be disabled. Refusing to patch twice.")

    replacement = '''// src/components/flow/FlowIndicator.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// FLOW INDICATOR DISABLED
// ═══════════════════════════════════════════════════════════════════════════════
//
// This component is intentionally kept as a safe no-op.
//
// Why:
// - The previous version displayed a floating "Building focus..." indicator.
// - That felt random and visually distracting in the app.
// - Keeping this file/export prevents import errors elsewhere in the app.
// - The feature can be restored later from the backup if needed.
//
// Backup created by script:
// src/components/flow/FlowIndicator.jsx.bak.before-disable-flow-indicator
// ═══════════════════════════════════════════════════════════════════════════════

import React from "react";

export default function FlowIndicator() {
  return null;
}

function BuildingIndicator() {
  return null;
}

function InFlowIndicator() {
  return null;
}

export { BuildingIndicator, InFlowIndicator };
'''

    if not BACKUP.exists():
        shutil.copy2(TARGET, BACKUP)
        print(f"[disable_flow_indicator] backup created: {BACKUP}")
    else:
        print(f"[disable_flow_indicator] backup already exists, preserved: {BACKUP}")

    TARGET.write_text(replacement, encoding="utf-8")

    updated = TARGET.read_text(encoding="utf-8")

    required_markers = [
        "FLOW INDICATOR DISABLED",
        "export default function FlowIndicator()",
        "function BuildingIndicator()",
        "function InFlowIndicator()",
        "export { BuildingIndicator, InFlowIndicator };",
    ]

    for marker in required_markers:
        if marker not in updated:
            fail(f"Post-edit verification failed. Missing marker: {marker}")

    print("\n[disable_flow_indicator] complete")
    print("\nNext checks:")
    print("  npm run build")
    print("  rg -n \"FlowIndicator|BuildingIndicator|InFlowIndicator|Building focus|In Flow|FLOW INDICATOR DISABLED\" src/components/flow/FlowIndicator.jsx src -C 4")
    print("  git diff -- src/components/flow/FlowIndicator.jsx")


if __name__ == "__main__":
    main()
