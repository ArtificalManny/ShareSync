#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-backend")
TARGET = ROOT / "src/projects/schemas/project.schema.ts"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[wire_project_schema_public_settings] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def main():
    print("[wire_project_schema_public_settings] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")
    original = source

    required_markers = [
        "export enum ProjectVisibility {",
        "export class ProjectSettings",
        "@Prop({ type: Boolean, default: false })\n  isPublic?: boolean;",
        "@Prop({ type: Boolean, default: false })\n  isListed?: boolean;",
        "ProjectSchema.index({ visibility: 1, 'settings.isListed': 1 });",
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}")

    # 1) Add a small enum for spectator/public access mode.
    old_visibility_enum = """export enum ProjectVisibility {
  PRIVATE = 'private',
  PUBLIC = 'public',
  LISTED = 'listed',
  TEAM = 'team',
}"""

    new_visibility_enum = """export enum ProjectVisibility {
  PRIVATE = 'private',
  PUBLIC = 'public',
  LISTED = 'listed',
  TEAM = 'team',
}

export enum ProjectPublicAccessMode {
  NONE = 'none',
  VIEW_ONLY = 'view_only',
  SUGGESTIONS = 'suggestions',
}"""

    if "export enum ProjectPublicAccessMode" not in source:
        if old_visibility_enum not in source:
            fail("Could not find ProjectVisibility enum block to extend.")
        source = source.replace(old_visibility_enum, new_visibility_enum, 1)
        print("[wire_project_schema_public_settings] added ProjectPublicAccessMode enum")
    else:
        print("[wire_project_schema_public_settings] ProjectPublicAccessMode enum already present")

    # 2) Extend ProjectSettings beside isPublic/isListed.
    old_settings_public_block = """  @Prop({ type: Boolean, default: false })
  isPublic?: boolean;

  @Prop({ type: Boolean, default: false })
  isListed?: boolean;
}"""

    new_settings_public_block = """  @Prop({ type: Boolean, default: false })
  isPublic?: boolean;

  @Prop({ type: Boolean, default: false })
  isListed?: boolean;

  @Prop({ type: Boolean, default: false })
  discoverable?: boolean;

  @Prop({
    type: String,
    enum: ProjectPublicAccessMode,
    default: ProjectPublicAccessMode.NONE,
  })
  publicAccessMode?: ProjectPublicAccessMode;

  @Prop({
    type: String,
    enum: ProjectPublicAccessMode,
    default: ProjectPublicAccessMode.NONE,
  })
  spectatorMode?: ProjectPublicAccessMode;

  @Prop({ type: Boolean, default: false })
  suggestionsEnabled?: boolean;
}"""

    if "publicAccessMode?: ProjectPublicAccessMode;" not in source:
        if old_settings_public_block not in source:
            fail("Could not find ProjectSettings isPublic/isListed block to extend.")
        source = source.replace(old_settings_public_block, new_settings_public_block, 1)
        print("[wire_project_schema_public_settings] added public listing settings fields")
    else:
        print("[wire_project_schema_public_settings] public listing settings fields already present")

    # 3) Add a narrow index for public listed discovery queries.
    old_index = "ProjectSchema.index({ visibility: 1, 'settings.isListed': 1 });"
    new_index = """ProjectSchema.index({ visibility: 1, 'settings.isListed': 1 });
ProjectSchema.index({ visibility: 1, 'settings.discoverable': 1, status: 1 });"""

    if "settings.discoverable" not in source:
        if old_index not in source:
            fail("Could not find visibility/settings.isListed index.")
        source = source.replace(old_index, new_index, 1)
        print("[wire_project_schema_public_settings] added discoverable index")
    else:
        print("[wire_project_schema_public_settings] discoverable index already present")

    required_after = [
        "export enum ProjectPublicAccessMode",
        "NONE = 'none'",
        "VIEW_ONLY = 'view_only'",
        "SUGGESTIONS = 'suggestions'",
        "discoverable?: boolean;",
        "publicAccessMode?: ProjectPublicAccessMode;",
        "spectatorMode?: ProjectPublicAccessMode;",
        "suggestionsEnabled?: boolean;",
        "ProjectSchema.index({ visibility: 1, 'settings.discoverable': 1, status: 1 });",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    if source == original:
        print("[wire_project_schema_public_settings] no changes needed")
        return

    backup = TARGET.with_name(f"{TARGET.name}.bak-public-settings-{STAMP}")
    backup.write_text(original, encoding="utf-8")
    print(f"[wire_project_schema_public_settings] backup created: {backup}")

    TARGET.write_text(source, encoding="utf-8")
    print(f"[wire_project_schema_public_settings] patched: {TARGET}")

    print("")
    print("[wire_project_schema_public_settings] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"ProjectPublicAccessMode|discoverable|publicAccessMode|spectatorMode|suggestionsEnabled|settings.discoverable\" src/projects/schemas/project.schema.ts -C 8")
    print("  git diff -- src/projects/schemas/project.schema.ts")


if __name__ == "__main__":
    main()
