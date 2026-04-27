#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-backend")
TARGET = ROOT / "src/tasks/tasks.service.ts"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[populate_priority_task_project_names] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def backup(path: Path, source: str):
    backup_path = path.with_name(f"{path.name}.bak-priority-project-names-{STAMP}")
    backup_path.write_text(source, encoding="utf-8")
    print(f"[populate_priority_task_project_names] backup created: {backup_path}")


def find_function_block(source: str, signature: str):
    start = source.find(signature)
    if start == -1:
        return None

    brace_start = source.find("{", start)
    if brace_start == -1:
        return None

    depth = 0
    in_string = None
    escape = False

    for index in range(brace_start, len(source)):
        char = source[index]

        if in_string:
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == in_string:
                in_string = None
            continue

        if char in ("'", '"', "`"):
            in_string = char
            continue

        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return start, index + 1

    return None


def patch_populate(block: str) -> str:
    if ".populate(" in block and "projectId" in block:
        print("[populate_priority_task_project_names] projectId populate already appears to exist")
        return block

    candidates = [
        ".lean()",
        ".exec()",
    ]

    populate_chain = """.populate({
        path: 'projectId',
        select: 'title name',
      })"""

    for candidate in candidates:
        if candidate in block:
            print(f"[populate_priority_task_project_names] inserting populate before {candidate}")
            return block.replace(candidate, populate_chain + "\n      " + candidate, 1)

    fail("Could not find .lean() or .exec() inside getMyPriorityTasks(). Paste the function if this fails.")


def patch_response_shape(block: str) -> str:
    if "projectName:" in block and "projectTitle:" in block:
        print("[populate_priority_task_project_names] projectName/projectTitle already appear in response")
        return block

    # If the service maps tasks before returning, enrich the mapped object.
    spread_markers = [
        "...task,",
        "...t,",
        "...item,",
    ]

    enrichment = """projectName:
        task?.projectId?.title ||
        task?.projectId?.name ||
        task?.projectName ||
        task?.projectTitle ||
        '',
      projectTitle:
        task?.projectId?.title ||
        task?.projectId?.name ||
        task?.projectTitle ||
        task?.projectName ||
        '',"""

    for marker in spread_markers:
        if marker in block:
            print(f"[populate_priority_task_project_names] adding projectName/projectTitle after {marker}")
            return block.replace(marker, marker + "\n      " + enrichment, 1)

    # If variable name is not task, add a safer post-processing return before final return if possible.
    return_marker = "return tasks;"
    if return_marker in block:
        replacement = """return tasks.map((task: any) => ({
      ...task,
      projectName:
        task?.projectId?.title ||
        task?.projectId?.name ||
        task?.projectName ||
        task?.projectTitle ||
        '',
      projectTitle:
        task?.projectId?.title ||
        task?.projectId?.name ||
        task?.projectTitle ||
        task?.projectName ||
        '',
    }));"""
        print("[populate_priority_task_project_names] replacing return tasks with enriched map")
        return block.replace(return_marker, replacement, 1)

    fail("Could not safely add projectName/projectTitle to getMyPriorityTasks() response. Paste the function if this fails.")


def main():
    print("[populate_priority_task_project_names] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")
    original = source

    required_before = [
        "getMyPriorityTasks",
        "taskModel",
        "projectId",
    ]

    for marker in required_before:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}")

    block_info = find_function_block(source, "async getMyPriorityTasks")
    if not block_info:
        block_info = find_function_block(source, "getMyPriorityTasks")

    if not block_info:
        fail("Could not locate getMyPriorityTasks() block.")

    start, end = block_info
    block = source[start:end]

    patched_block = patch_populate(block)
    patched_block = patch_response_shape(patched_block)

    required_after_in_block = [
        "populate({",
        "path: 'projectId'",
        "select: 'title name'",
        "projectName:",
        "projectTitle:",
    ]

    for marker in required_after_in_block:
        if marker not in patched_block:
            fail(f"Safety check failed inside patched block. Missing marker: {marker}")

    source = source[:start] + patched_block + source[end:]

    if source == original:
        print("[populate_priority_task_project_names] no changes needed")
        return

    backup(TARGET, original)
    TARGET.write_text(source, encoding="utf-8")
    print(f"[populate_priority_task_project_names] patched: {TARGET}")

    print("")
    print("[populate_priority_task_project_names] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"getMyPriorityTasks|populate\\(|path: 'projectId'|select: 'title name'|projectName:|projectTitle:\" src/tasks/tasks.service.ts -C 10")
    print("  git diff -- src/tasks/tasks.service.ts")


if __name__ == "__main__":
    main()
