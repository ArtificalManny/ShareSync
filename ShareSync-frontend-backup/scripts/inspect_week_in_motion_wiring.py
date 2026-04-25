#!/usr/bin/env python3
from pathlib import Path
import sys

FRONTEND = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
BACKEND = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-backend")

FRONTEND_TARGETS = [
    FRONTEND / "src/components/home/WeekInMotion.jsx",
    FRONTEND / "src/pages/Home.jsx",
    FRONTEND / "src/api/client.js",
    FRONTEND / "src/api/client.ts",
]

BACKEND_HINTS = [
    "weekly-rhythm",
    "weeklyRhythm",
    "activity-summary",
    "activities",
    "Activity",
    "Task",
    "tasks",
    "ship",
    "shipped",
    "completed",
    "Gateway",
    "emit",
    "users/me",
]


def print_matches(root, label, tokens):
    print("")
    print(f"---- {label} ----")

    if not root.exists():
        print(f"Missing root: {root}")
        return

    for path in root.rglob("*"):
        if path.suffix not in {".js", ".jsx", ".ts", ".tsx"}:
            continue
        if ".bak" in path.name:
            continue

        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue

        hits = [token for token in tokens if token in text]
        if hits:
            print(f"{path}")
            print(f"  hits: {', '.join(hits)}")


def print_file(path):
    print("")
    print(f"---- FILE: {path} ----")
    if not path.exists():
        print("missing")
        return

    lines = path.read_text(encoding="utf-8", errors="ignore").splitlines()
    for i, line in enumerate(lines, start=1):
        if any(token in line for token in ["weekly-rhythm", "WeekInMotion", "task.completed", "local-ship", "socket", "useSocket"]):
            start = max(1, i - 5)
            end = min(len(lines), i + 8)
            print("")
            print(f"context around line {i}")
            for n in range(start, end + 1):
                print(f"{n:>5}: {lines[n - 1]}")


def main():
    print("[inspect_week_in_motion_wiring] starting")

    for path in FRONTEND_TARGETS:
        print_file(path)

    print_matches(
        FRONTEND / "src",
        "FRONTEND weekly motion / socket / activity references",
        ["weekly-rhythm", "WeekInMotion", "task.completed", "local-ship", "socket", "useSocket", "shipped", "completed"]
    )

    print_matches(
        BACKEND / "src",
        "BACKEND possible weekly rhythm data sources",
        BACKEND_HINTS
    )

    print("")
    print("[inspect_week_in_motion_wiring] done")
    print("")
    print("Next:")
    print("  Paste this output.")
    print("  Especially paste any backend controller/service files mentioning users/me, activities, tasks, ship, or completed.")


if __name__ == "__main__":
    main()
