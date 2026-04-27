#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import re
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-backend")
TARGET = ROOT / "src/projects/projects.service.ts"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[harden_projects_service_discover_filter] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def find_matching_brace(source: str, open_brace_index: int) -> int:
    depth = 0
    in_string = None
    escape = False

    for i in range(open_brace_index, len(source)):
        ch = source[i]

        if in_string:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == in_string:
                in_string = None
            continue

        if ch in ("'", '"', "`"):
            in_string = ch
            continue

        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return i

    fail("Could not find matching closing brace.")


def find_method_block(source: str, method_name: str):
    match = re.search(rf"\n\s+async\s+{re.escape(method_name)}\s*\(", source)
    if not match:
        fail(f"Could not find async {method_name}(...) method.")

    open_brace = source.find("{", match.end())
    if open_brace == -1:
        fail(f"Could not find opening brace for {method_name} method.")

    close_brace = find_matching_brace(source, open_brace)
    return match.start(), open_brace, close_brace


def find_class_insertion_point(source: str) -> int:
    # Prefer placing this helper immediately before getFeaturedProjects.
    match = re.search(r"\n\s+async\s+getFeaturedProjects\s*\(", source)
    if match:
        return match.start()

    # Fallback: before createFromTemplate if present.
    match = re.search(r"\n\s+async\s+createFromTemplate\s*\(", source)
    if match:
        return match.start()

    fail("Could not find safe insertion point for getPublicDiscoverableProjectFilter helper.")


def replace_first_find_object_with_helper(method_block: str) -> str:
    find_pos = method_block.find(".find(")
    if find_pos == -1:
        fail("Could not find .find(...) inside getFeaturedProjects.")

    paren_start = method_block.find("(", find_pos)
    if paren_start == -1:
        fail("Could not parse .find(...) call.")

    i = paren_start + 1
    while i < len(method_block) and method_block[i].isspace():
        i += 1

    if i < len(method_block) and method_block.startswith("this.getPublicDiscoverableProjectFilter()", i):
        print("[harden_projects_service_discover_filter] getFeaturedProjects already uses helper filter")
        return method_block

    if i >= len(method_block) or method_block[i] != "{":
        fail("Expected getFeaturedProjects .find(...) to receive an object literal.")

    obj_start = i
    obj_end = find_matching_brace(method_block, obj_start)

    return (
        method_block[:obj_start]
        + "this.getPublicDiscoverableProjectFilter()"
        + method_block[obj_end + 1:]
    )


def main():
    print("[harden_projects_service_discover_filter] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")
    original = source

    required = [
        "ProjectVisibility",
        "ProjectStatus",
        "async getFeaturedProjects",
    ]

    for marker in required:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}")

    helper = """  private getPublicDiscoverableProjectFilter() {
    return {
      $and: [
        {
          $or: [
            { visibility: ProjectVisibility.PUBLIC },
            { visibility: ProjectVisibility.LISTED },
            { isPublic: true },
            { 'settings.isPublic': true },
          ],
        },
        {
          $or: [
            { isListed: true },
            { discoverable: true },
            { 'settings.isListed': true },
            { 'settings.discoverable': true },
          ],
        },
        { status: { $ne: ProjectStatus.ARCHIVED } },
        { isArchived: { $ne: true } },
      ],
    };
  }

"""

    if "private getPublicDiscoverableProjectFilter()" not in source:
        insert_at = find_class_insertion_point(source)
        source = source[:insert_at] + "\n" + helper + source[insert_at:]
        print("[harden_projects_service_discover_filter] inserted reusable public/listed project filter")
    else:
        print("[harden_projects_service_discover_filter] reusable public/listed project filter already present")

    method_start, _open_brace, method_close = find_method_block(source, "getFeaturedProjects")
    method_block = source[method_start:method_close + 1]

    patched_method = replace_first_find_object_with_helper(method_block)

    if patched_method != method_block:
        source = source[:method_start] + patched_method + source[method_close + 1:]
        print("[harden_projects_service_discover_filter] patched getFeaturedProjects to use public/listed helper")

    required_after = [
        "private getPublicDiscoverableProjectFilter()",
        "{ visibility: ProjectVisibility.PUBLIC }",
        "{ visibility: ProjectVisibility.LISTED }",
        "{ 'settings.isPublic': true }",
        "{ 'settings.isListed': true }",
        "{ 'settings.discoverable': true }",
        "this.getPublicDiscoverableProjectFilter()",
        "async getFeaturedProjects",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    # Safety: getFeaturedProjects should contain the helper call.
    method_start, _open_brace, method_close = find_method_block(source, "getFeaturedProjects")
    final_method_block = source[method_start:method_close + 1]
    if "this.getPublicDiscoverableProjectFilter()" not in final_method_block:
        fail("Safety check failed: getFeaturedProjects does not use helper filter.")

    if source == original:
        print("[harden_projects_service_discover_filter] no changes needed")
        return

    backup = TARGET.with_name(f"{TARGET.name}.bak-harden-discover-filter-{STAMP}")
    backup.write_text(original, encoding="utf-8")
    print(f"[harden_projects_service_discover_filter] backup created: {backup}")

    TARGET.write_text(source, encoding="utf-8")
    print(f"[harden_projects_service_discover_filter] patched: {TARGET}")

    print("")
    print("[harden_projects_service_discover_filter] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"getPublicDiscoverableProjectFilter|settings.isPublic|settings.isListed|settings.discoverable|getFeaturedProjects|this.getPublicDiscoverableProjectFilter\" src/projects/projects.service.ts -C 8")
    print("  git diff -- src/projects/projects.service.ts")


if __name__ == "__main__":
    main()
