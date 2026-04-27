#!/usr/bin/env python3
from pathlib import Path

FRONTEND = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
BACKEND = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-backend")

FRONTEND_TARGETS = [
    FRONTEND / "src/pages/ProjectHome.jsx",
    FRONTEND / "src/api",
    FRONTEND / "src/components",
    FRONTEND / "src/features",
]

BACKEND_TARGETS = [
    BACKEND / "src",
]

KEYWORDS = [
    "sprint",
    "Sprint",
    "currentSprint",
    "current sprint",
    "Start Your First Sprint",
    "onSprintAction",
    "handleSprintAction",
    "velocity",
    "iteration",
    "cycle",
]

def scan_file(path):
    try:
        text = path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return []

    hits = []
    for i, line in enumerate(text.splitlines(), start=1):
        if any(k in line for k in KEYWORDS):
            hits.append((i, line.rstrip()))
    return hits

def scan_root(root, label):
    print("")
    print("=" * 90)
    print(label)
    print("=" * 90)

    if not root.exists():
        print(f"MISSING: {root}")
        return

    files = []
    if root.is_file():
        files = [root]
    else:
        files = [
            p for p in root.rglob("*")
            if p.suffix in {".js", ".jsx", ".ts", ".tsx"}
            and ".bak" not in p.name
        ]

    found_any = False

    for path in files:
        hits = scan_file(path)
        if not hits:
            continue

        found_any = True
        print("")
        print(f"FILE: {path}")
        for line_no, line in hits[:40]:
            print(f"{line_no:>5}: {line}")

        if len(hits) > 40:
            print(f"      ... {len(hits) - 40} more hits")

    if not found_any:
        print("No sprint-related references found.")

def main():
    print("[inspect_sprint_wiring] starting")

    for target in FRONTEND_TARGETS:
        scan_root(target, f"FRONTEND SCAN: {target}")

    for target in BACKEND_TARGETS:
        scan_root(target, f"BACKEND SCAN: {target}")

    print("")
    print("[inspect_sprint_wiring] done")
    print("")
    print("Next:")
    print("  Paste this output.")
    print("  Most important: ProjectHome.jsx sprint state/handlers and any backend sprint/project service references.")

if __name__ == "__main__":
    main()
