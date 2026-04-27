#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-backend")
TARGET = ROOT / "src/projects/projects.service.ts"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[fix_projects_create_public_config] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def main():
    print("[fix_projects_create_public_config] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")
    original = source

    required = [
        "async create(userId: string, dto: CreateProjectDto): Promise<ProjectDocument> {",
        "const publicConfig = this.normalizeProjectPublicConfig(userId as any);",
        "const settings = {",
        "settings: {",
        "...((userId as any).settings || {}),",
        "settings,",
        "visibility,",
    ]

    for marker in required:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}")

    replacements = [
        (
            "    const publicConfig = this.normalizeProjectPublicConfig(userId as any);",
            "    const publicConfig = this.normalizeProjectPublicConfig(dto as any);",
            "fixed publicConfig source from userId to dto",
        ),
        (
            "      visibility,",
            "      visibility: publicConfig.visibility,",
            "patched project visibility to use publicConfig",
        ),
        (
            "        ...((userId as any).settings || {}),",
            "        ...(settings || {}),",
            "patched settings spread to use normalized dto settings",
        ),
        (
            "      settings,\n",
            "",
            "removed duplicate settings property",
        ),
    ]

    for old, new, label in replacements:
        count = source.count(old)
        if count == 0:
            fail(f"Could not find exact text for replacement: {label}")
        if label == "removed duplicate settings property" and count != 1:
            fail(f"Expected exactly 1 duplicate settings property, found {count}")
        source = source.replace(old, new, 1)
        print(f"[fix_projects_create_public_config] {label}")

    required_after = [
        "const publicConfig = this.normalizeProjectPublicConfig(dto as any);",
        "visibility: publicConfig.visibility,",
        "...(settings || {}),",
        "isPublic: publicConfig.isPublic",
        "isListed: publicConfig.isListed",
        "discoverable: publicConfig.discoverable",
        "publicAccessMode: publicConfig.publicAccessMode",
        "suggestionsEnabled: publicConfig.suggestionsEnabled",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    # Safety: ensure there is not a duplicate settings property in the immediate create object range.
    create_start = source.find("async create(userId: string, dto: CreateProjectDto): Promise<ProjectDocument> {")
    create_end = source.find("this.eventEmitter.emit('project.created'", create_start)
    if create_start == -1 or create_end == -1:
        fail("Could not safely inspect create method after patch.")

    create_slice = source[create_start:create_end]
    if create_slice.count("\n      settings:") != 1:
        fail(f"Safety check failed: expected exactly one project-object settings property, found {create_slice.count(chr(10) + '      settings:')}")

    if "const publicConfig = this.normalizeProjectPublicConfig(userId as any);" in create_slice:
        fail("Safety check failed: publicConfig still uses userId.")

    if source == original:
        print("[fix_projects_create_public_config] no changes needed")
        return

    backup = TARGET.with_name(f"{TARGET.name}.bak-fix-create-public-config-{STAMP}")
    backup.write_text(original, encoding="utf-8")
    print(f"[fix_projects_create_public_config] backup created: {backup}")

    TARGET.write_text(source, encoding="utf-8")
    print(f"[fix_projects_create_public_config] patched: {TARGET}")

    print("")
    print("[fix_projects_create_public_config] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  nl -ba src/projects/projects.service.ts | sed -n '360,430p'")
    print("  rg -n \"normalizeProjectPublicConfig|publicConfig|visibility: publicConfig.visibility|settings:|settings.isListed|settings.discoverable\" src/projects/projects.service.ts -C 6")
    print("  git diff -- src/projects/projects.service.ts")


if __name__ == "__main__":
    main()
