#!/usr/bin/env python3
from pathlib import Path

BACKEND = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-backend")

TARGETS = [
    BACKEND / "src/user/user.controller.ts",
    BACKEND / "src/user/user.service.ts",
    BACKEND / "src/user/user.module.ts",
    BACKEND / "src/tasks/schemas/task.schema.ts",
    BACKEND / "src/activities/schemas/activity.schema.ts",
    BACKEND / "src/tasks/tasks.service.ts",
    BACKEND / "src/tasks/tasks.controller.ts",
    BACKEND / "src/utils/activitySummary.ts",
]

KEYWORDS = [
    "@Controller",
    "@Get",
    "activity-summary",
    "users/me",
    "me/",
    "Req",
    "AuthGuard",
    "JwtAuthGuard",
    "InjectModel",
    "Task",
    "taskModel",
    "Activity",
    "activityModel",
    "completedAt",
    "completedBy",
    "createdBy",
    "userId",
    "assigneeId",
    "status",
    "done",
    "completed",
]

def show_file(path):
    print("")
    print("=" * 90)
    print(f"FILE: {path}")
    print("=" * 90)

    if not path.exists():
        print("MISSING")
        return

    text = path.read_text(encoding="utf-8", errors="ignore")
    lines = text.splitlines()

    print(f"Total lines: {len(lines)}")
    print("")

    # Show imports and decorators at top.
    print("---- TOP 80 LINES ----")
    for i, line in enumerate(lines[:80], start=1):
        print(f"{i:>4}: {line}")

    # Show keyword contexts.
    seen = set()
    for i, line in enumerate(lines, start=1):
        if any(k in line for k in KEYWORDS):
            start = max(1, i - 6)
            end = min(len(lines), i + 12)
            key = (start, end)
            if key in seen:
                continue
            seen.add(key)

            print("")
            print(f"---- CONTEXT AROUND LINE {i}: {line.strip()[:120]} ----")
            for n in range(start, end + 1):
                print(f"{n:>4}: {lines[n - 1]}")

def main():
    print("[inspect_weekly_rhythm_backend_targets] starting")
    for target in TARGETS:
        show_file(target)

    print("")
    print("[inspect_weekly_rhythm_backend_targets] done")
    print("")
    print("Next:")
    print("  Paste the output here.")
    print("  The most important files are user.controller.ts, user.service.ts, user.module.ts, and task.schema.ts.")

if __name__ == "__main__":
    main()
