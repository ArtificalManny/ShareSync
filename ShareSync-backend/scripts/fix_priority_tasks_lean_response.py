#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-backend")
TARGET = ROOT / "src/tasks/tasks.service.ts"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[fix_priority_tasks_lean_response] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def main():
    print("[fix_priority_tasks_lean_response] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")
    original = source

    required = [
        "async getMyPriorityTasks",
        ".populate({",
        "path: 'projectId'",
        "select: 'title name'",
        "return tasks.map((task: any) => ({",
        "projectName:",
        "projectTitle:",
    ]

    for marker in required:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}")

    old = """      .populate({
        path: 'projectId',
        select: 'title name',
      })
      .exec();"""

    new = """      .populate({
        path: 'projectId',
        select: 'title name',
      })
      .lean()
      .exec();"""

    if old not in source:
        if ".lean()" in source:
            print("[fix_priority_tasks_lean_response] .lean() already exists")
        else:
            fail("Could not find exact populate/exec chain to patch.")
    else:
        source = source.replace(old, new, 1)
        print("[fix_priority_tasks_lean_response] inserted .lean() before .exec()")

    # Keep TypeScript honest: this function now returns enriched plain objects, not pure TaskDocument instances.
    old_type = """  ): Promise<TaskDocument[]> {"""
    new_type = """  ): Promise<any[]> {"""

    if old_type in source:
        source = source.replace(old_type, new_type, 1)
        print("[fix_priority_tasks_lean_response] updated return type to Promise<any[]>")
    elif "): Promise<any[]> {" in source:
        print("[fix_priority_tasks_lean_response] return type already Promise<any[]>")
    else:
        fail("Could not find getMyPriorityTasks return type to patch.")

    required_after = [
        ".lean()",
        "): Promise<any[]> {",
        "projectName:",
        "projectTitle:",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    if source == original:
        print("[fix_priority_tasks_lean_response] no changes needed")
        return

    backup_path = TARGET.with_name(f"{TARGET.name}.bak-priority-lean-{STAMP}")
    backup_path.write_text(original, encoding="utf-8")
    print(f"[fix_priority_tasks_lean_response] backup created: {backup_path}")

    TARGET.write_text(source, encoding="utf-8")
    print(f"[fix_priority_tasks_lean_response] patched: {TARGET}")

    print("")
    print("[fix_priority_tasks_lean_response] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"getMyPriorityTasks|Promise<any\\[\\]>|populate\\(|path: 'projectId'|select: 'title name'|lean\\(\\)|projectName:|projectTitle:\" src/tasks/tasks.service.ts -C 10")
    print("  git diff -- src/tasks/tasks.service.ts")


if __name__ == "__main__":
    main()
