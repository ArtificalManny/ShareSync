#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import re
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-backend")
TARGET = ROOT / "src/projects/projects.service.ts"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[wire_projects_service_public_listing] ERROR: {message}\n", file=sys.stderr)
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
    pattern = re.compile(rf"\n\s+async\s+{re.escape(method_name)}\s*\(")
    match = pattern.search(source)
    if not match:
        fail(f"Could not find async {method_name}(...) method.")

    signature_start = match.start()
    open_brace = source.find("{", match.end())
    if open_brace == -1:
        fail(f"Could not find opening brace for {method_name} method.")

    close_brace = find_matching_brace(source, open_brace)
    return signature_start, open_brace, close_brace


def parse_create_dto_param(create_signature: str) -> str:
    # Prefer a parameter explicitly typed as CreateProjectDto.
    match = re.search(r"\(\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*:\s*CreateProjectDto", create_signature)
    if match:
        return match.group(1)

    # Fallback: first parameter name.
    match = re.search(r"\(\s*([A-Za-z_$][A-Za-z0-9_$]*)", create_signature)
    if match:
        return match.group(1)

    fail("Could not determine create method DTO parameter name.")


def main():
    print("[wire_projects_service_public_listing] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")
    original = source

    required_markers = [
        "ProjectVisibility",
        "ProjectStatus",
        "async create",
        "async getFeaturedProjects",
        "visibility: ProjectVisibility.PUBLIC",
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}")

    # 1) Import ProjectPublicAccessMode from project schema import block.
    if "ProjectPublicAccessMode" not in source:
        if "ProjectVisibility," in source:
            source = source.replace(
                "ProjectVisibility,",
                "ProjectVisibility,\n  ProjectPublicAccessMode,",
                1,
            )
            print("[wire_projects_service_public_listing] added ProjectPublicAccessMode import")
        elif "ProjectVisibility" in source:
            source = source.replace(
                "ProjectVisibility",
                "ProjectVisibility,\n  ProjectPublicAccessMode",
                1,
            )
            print("[wire_projects_service_public_listing] added ProjectPublicAccessMode import")
        else:
            fail("Could not find ProjectVisibility import location.")
    else:
        print("[wire_projects_service_public_listing] ProjectPublicAccessMode already imported/present")

    # 2) Insert private helper before async create().
    helper_marker = "private normalizeProjectPublicConfig"
    helper = """  private normalizeProjectPublicConfig(dto: any) {
    const rawVisibility = String(dto?.visibility || '').trim().toLowerCase();
    const rawPrivacy = String(dto?.privacy || '').trim().toLowerCase();

    const isPublic =
      dto?.isPublic === true ||
      rawVisibility === ProjectVisibility.PUBLIC ||
      rawVisibility === 'public' ||
      rawVisibility === 'listed' ||
      rawPrivacy === 'public' ||
      rawPrivacy === 'listed';

    const isListed = isPublic
      ? Boolean(
          dto?.isListed ??
            dto?.discoverable ??
            dto?.settings?.isListed ??
            dto?.settings?.discoverable ??
            false,
        )
      : false;

    const rawAccessMode = String(
      dto?.publicAccessMode ??
        dto?.spectatorMode ??
        dto?.settings?.publicAccessMode ??
        dto?.settings?.spectatorMode ??
        '',
    )
      .trim()
      .toLowerCase();

    const publicAccessMode = !isPublic
      ? ProjectPublicAccessMode.NONE
      : rawAccessMode === 'suggest' || rawAccessMode === 'suggestions'
        ? ProjectPublicAccessMode.SUGGESTIONS
        : ProjectPublicAccessMode.VIEW_ONLY;

    const suggestionsEnabled =
      isPublic &&
      (publicAccessMode === ProjectPublicAccessMode.SUGGESTIONS ||
        dto?.suggestionsEnabled === true ||
        dto?.settings?.suggestionsEnabled === true);

    return {
      visibility: isPublic ? ProjectVisibility.PUBLIC : ProjectVisibility.PRIVATE,
      isPublic,
      isListed,
      discoverable: isListed,
      publicAccessMode,
      spectatorMode: publicAccessMode,
      suggestionsEnabled,
    };
  }

"""

    if helper_marker not in source:
        create_match = re.search(r"\n\s+async\s+create\s*\(", source)
        if not create_match:
            fail("Could not find async create method insertion point.")
        source = source[:create_match.start()] + "\n" + helper + source[create_match.start():]
        print("[wire_projects_service_public_listing] inserted normalizeProjectPublicConfig helper")
    else:
        print("[wire_projects_service_public_listing] normalizeProjectPublicConfig helper already present")

    # 3) Re-find create method after helper insertion.
    create_start, create_open, create_close = find_method_block(source, "create")
    create_block = source[create_start:create_close + 1]
    create_signature = source[create_start:create_open]
    dto_name = parse_create_dto_param(create_signature)

    print(f"[wire_projects_service_public_listing] detected create DTO parameter: {dto_name}")

    # 3a) Insert publicConfig inside create method.
    if "const publicConfig = this.normalizeProjectPublicConfig" not in create_block:
        insertion = f"\n    const publicConfig = this.normalizeProjectPublicConfig({dto_name} as any);\n"

        # Insert right after method opening brace.
        source = source[:create_open + 1] + insertion + source[create_open + 1:]
        print("[wire_projects_service_public_listing] inserted publicConfig into create method")

        # Re-find create method after insertion.
        create_start, create_open, create_close = find_method_block(source, "create")
        create_block = source[create_start:create_close + 1]
    else:
        print("[wire_projects_service_public_listing] create method already has publicConfig")

    # 3b) Patch create method visibility line.
    if "visibility: publicConfig.visibility" not in create_block:
        visibility_line_pattern = re.compile(r"(\n\s*)visibility\s*:\s*[^,\n]+,")
        match = visibility_line_pattern.search(create_block)

        if match:
            replacement = f"{match.group(1)}visibility: publicConfig.visibility,"
            create_block = create_block[:match.start()] + replacement + create_block[match.end():]
            print("[wire_projects_service_public_listing] patched create visibility assignment")
        else:
            # If no visibility line exists, insert near status if possible.
            status_pattern = re.compile(r"(\n\s*status\s*:\s*[^,\n]+,)")
            status_match = status_pattern.search(create_block)
            if not status_match:
                fail("Could not find visibility or status assignment inside create method.")
            insert_at = status_match.end()
            create_block = (
                create_block[:insert_at]
                + "\n      visibility: publicConfig.visibility,"
                + create_block[insert_at:]
            )
            print("[wire_projects_service_public_listing] inserted create visibility assignment")
    else:
        print("[wire_projects_service_public_listing] create visibility already patched")

    # 3c) Patch or insert settings assignment inside create method.
    settings_assignment = f"""settings: {{
        ...(({dto_name} as any).settings || {{}}),
        isPublic: publicConfig.isPublic,
        isListed: publicConfig.isListed,
        discoverable: publicConfig.discoverable,
        publicAccessMode: publicConfig.publicAccessMode,
        spectatorMode: publicConfig.spectatorMode,
        suggestionsEnabled: publicConfig.suggestionsEnabled,
      }},"""

    if "isPublic: publicConfig.isPublic" not in create_block:
        # Try replacing a simple settings: ... line first.
        simple_settings_pattern = re.compile(r"(\n\s*)settings\s*:\s*[^,\n]+,")
        match = simple_settings_pattern.search(create_block)

        if match:
            indent = match.group(1)
            replacement = indent + settings_assignment
            create_block = create_block[:match.start()] + replacement + create_block[match.end():]
            print("[wire_projects_service_public_listing] replaced simple settings assignment")
        else:
            # Insert before members if possible, then ownerId, then createdBy.
            insertion_targets = [
                r"\n\s*members\s*:",
                r"\n\s*ownerId\s*:",
                r"\n\s*createdBy\s*:",
            ]

            inserted = False
            for target in insertion_targets:
                target_match = re.search(target, create_block)
                if target_match:
                    # Determine indentation from the matched target line.
                    line_start = create_block.rfind("\n", 0, target_match.start()) + 1
                    line = create_block[line_start:target_match.start()]
                    indent = re.match(r"\s*", line).group(0) if line is not None else "      "

                    create_block = (
                        create_block[:target_match.start()]
                        + f"\n      {settings_assignment}"
                        + create_block[target_match.start():]
                    )
                    inserted = True
                    print("[wire_projects_service_public_listing] inserted settings assignment")
                    break

            if not inserted:
                fail("Could not find a safe insertion point for settings assignment inside create method.")
    else:
        print("[wire_projects_service_public_listing] create settings already patched")

    # Replace create block in source.
    source = source[:create_start] + create_block + source[create_close + 1:]

    # 4) Patch getFeaturedProjects to require listed/discoverable projects.
    get_featured_start, get_featured_open, get_featured_close = find_method_block(source, "getFeaturedProjects")
    featured_block = source[get_featured_start:get_featured_close + 1]

    old_featured_filter = """      .find({
        visibility: ProjectVisibility.PUBLIC,
        status: { $ne: ProjectStatus.ARCHIVED },
      })"""

    new_featured_filter = """      .find({
        visibility: ProjectVisibility.PUBLIC,
        status: { $ne: ProjectStatus.ARCHIVED },
        $or: [
          { 'settings.isListed': true },
          { 'settings.discoverable': true },
          { isListed: true },
          { discoverable: true },
        ],
      })"""

    if "'settings.discoverable': true" not in featured_block:
        if old_featured_filter not in featured_block:
            fail("Could not find exact getFeaturedProjects public filter to patch.")
        featured_block = featured_block.replace(old_featured_filter, new_featured_filter, 1)
        print("[wire_projects_service_public_listing] patched getFeaturedProjects listed/discoverable filter")
    else:
        print("[wire_projects_service_public_listing] getFeaturedProjects already filters listed/discoverable")

    source = source[:get_featured_start] + featured_block + source[get_featured_close + 1:]

    required_after = [
        "ProjectPublicAccessMode",
        "private normalizeProjectPublicConfig",
        "const publicConfig = this.normalizeProjectPublicConfig",
        "visibility: publicConfig.visibility",
        "isPublic: publicConfig.isPublic",
        "isListed: publicConfig.isListed",
        "discoverable: publicConfig.discoverable",
        "publicAccessMode: publicConfig.publicAccessMode",
        "spectatorMode: publicConfig.spectatorMode",
        "suggestionsEnabled: publicConfig.suggestionsEnabled",
        "'settings.isListed': true",
        "'settings.discoverable': true",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    if source == original:
        print("[wire_projects_service_public_listing] no changes needed")
        return

    backup = TARGET.with_name(f"{TARGET.name}.bak-public-listing-service-{STAMP}")
    backup.write_text(original, encoding="utf-8")
    print(f"[wire_projects_service_public_listing] backup created: {backup}")

    TARGET.write_text(source, encoding="utf-8")
    print(f"[wire_projects_service_public_listing] patched: {TARGET}")

    print("")
    print("[wire_projects_service_public_listing] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"ProjectPublicAccessMode|normalizeProjectPublicConfig|publicConfig|settings.isListed|settings.discoverable|publicAccessMode|suggestionsEnabled|getFeaturedProjects\" src/projects/projects.service.ts -C 8")
    print("  git diff -- src/projects/projects.service.ts")


if __name__ == "__main__":
    main()
