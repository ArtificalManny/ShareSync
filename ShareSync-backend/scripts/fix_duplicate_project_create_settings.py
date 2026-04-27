#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import re
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-backend")
TARGET = ROOT / "src/projects/projects.service.ts"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[fix_duplicate_project_create_settings] ERROR: {message}\n", file=sys.stderr)
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


def find_create_method(source: str):
    match = re.search(r"\n\s+async\s+create\s*\(", source)
    if not match:
        fail("Could not find async create(...) method.")

    open_brace = source.find("{", match.end())
    if open_brace == -1:
        fail("Could not find opening brace for create method.")

    close_brace = find_matching_brace(source, open_brace)
    return match.start(), close_brace + 1


def find_property_end(block: str, prop_start: int) -> int:
    # prop_start points at beginning of "settings:"
    colon = block.find(":", prop_start)
    if colon == -1:
        fail("Could not find colon for settings property.")

    i = colon + 1

    # Skip whitespace
    while i < len(block) and block[i].isspace():
        i += 1

    if i >= len(block):
        fail("Could not parse settings property value.")

    # If value is object/array/call, walk nested delimiters until top-level comma.
    depth_curly = 0
    depth_square = 0
    depth_paren = 0
    in_string = None
    escape = False

    while i < len(block):
        ch = block[i]

        if in_string:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == in_string:
                in_string = None
            i += 1
            continue

        if ch in ("'", '"', "`"):
            in_string = ch
            i += 1
            continue

        if ch == "{":
            depth_curly += 1
        elif ch == "}":
            if depth_curly == 0 and depth_square == 0 and depth_paren == 0:
                # End of parent object without comma.
                return i
            depth_curly -= 1
        elif ch == "[":
            depth_square += 1
        elif ch == "]":
            depth_square -= 1
        elif ch == "(":
            depth_paren += 1
        elif ch == ")":
            depth_paren -= 1
        elif ch == "," and depth_curly == 0 and depth_square == 0 and depth_paren == 0:
            return i + 1

        i += 1

    fail("Could not find end of settings property.")


def main():
    print("[fix_duplicate_project_create_settings] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")
    original = source

    required = [
        "async create",
        "const publicConfig = this.normalizeProjectPublicConfig",
        "isPublic: publicConfig.isPublic",
        "isListed: publicConfig.isListed",
        "settings:",
    ]

    for marker in required:
        if marker not in source:
            fail(f"Missing expected marker before fix: {marker}")

    create_start, create_end = find_create_method(source)
    create_block = source[create_start:create_end]

    settings_matches = list(re.finditer(r"(?m)^(\s*)settings\s*:", create_block))
    print(f"[fix_duplicate_project_create_settings] settings properties inside create(): {len(settings_matches)}")

    if len(settings_matches) <= 1:
        print("[fix_duplicate_project_create_settings] no duplicate settings property found inside create()")
        return

    # Keep the settings block that contains publicConfig fields.
    keep_index = None
    ranges = []

    for idx, match in enumerate(settings_matches):
        prop_start = match.start()
        prop_end = find_property_end(create_block, prop_start)
        prop_text = create_block[prop_start:prop_end]

        if "publicConfig.isPublic" in prop_text and "publicConfig.isListed" in prop_text:
            keep_index = idx

        ranges.append((prop_start, prop_end, prop_text))

    if keep_index is None:
        fail("Could not find the publicConfig-aware settings block to keep.")

    # Remove all settings properties except the publicConfig-aware one.
    remove_ranges = [
        (start, end)
        for idx, (start, end, _text) in enumerate(ranges)
        if idx != keep_index
    ]

    if not remove_ranges:
        print("[fix_duplicate_project_create_settings] nothing to remove")
        return

    # Remove from bottom to top so indexes remain valid.
    patched_create = create_block
    for start, end in sorted(remove_ranges, reverse=True):
        # Also remove one following blank line if present.
        removal_end = end
        if patched_create[removal_end:removal_end + 2] == "\n\n":
            removal_end += 1

        removed_preview = patched_create[start:removal_end].strip().splitlines()[0]
        patched_create = patched_create[:start] + patched_create[removal_end:]
        print(f"[fix_duplicate_project_create_settings] removed duplicate property starting with: {removed_preview}")

    # Safety: exactly one settings property remains in create.
    remaining = list(re.finditer(r"(?m)^(\s*)settings\s*:", patched_create))
    if len(remaining) != 1:
        fail(f"Safety check failed: expected 1 settings property after fix, found {len(remaining)}")

    remaining_start = remaining[0].start()
    remaining_end = find_property_end(patched_create, remaining_start)
    remaining_text = patched_create[remaining_start:remaining_end]

    for marker in [
        "publicConfig.isPublic",
        "publicConfig.isListed",
        "publicConfig.discoverable",
        "publicConfig.publicAccessMode",
        "publicConfig.suggestionsEnabled",
    ]:
        if marker not in remaining_text:
            fail(f"Safety check failed: remaining settings block missing {marker}")

    source = source[:create_start] + patched_create + source[create_end:]

    if source == original:
        print("[fix_duplicate_project_create_settings] no changes needed")
        return

    backup = TARGET.with_name(f"{TARGET.name}.bak-fix-duplicate-settings-{STAMP}")
    backup.write_text(original, encoding="utf-8")
    print(f"[fix_duplicate_project_create_settings] backup created: {backup}")

    TARGET.write_text(source, encoding="utf-8")
    print(f"[fix_duplicate_project_create_settings] patched: {TARGET}")

    print("")
    print("[fix_duplicate_project_create_settings] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  nl -ba src/projects/projects.service.ts | sed -n '390,435p'")
    print("  rg -n \"settings:|publicConfig|normalizeProjectPublicConfig|settings.isListed|settings.discoverable\" src/projects/projects.service.ts -C 6")
    print("  git diff -- src/projects/projects.service.ts")


if __name__ == "__main__":
    main()
