#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-backend")
TARGET = ROOT / "src/projects/dto/create-project.dto.ts"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[wire_create_project_dto_public_listing] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def main():
    print("[wire_create_project_dto_public_listing] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")
    original = source

    required_markers = [
        "export class CreateProjectSettingsDto {",
        "isPublic?: boolean;",
        "isListed?: boolean;",
        "export class CreateProjectDto {",
        "visibility?: ProjectVisibility;",
        "privacy?: string;",
        "isPublic?: boolean;",
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}")

    # 1) Add settings-level public/listing/spectator fields.
    old_settings_block = """  @ApiPropertyOptional({ description: 'Whether project appears in Discover/search' })
  @IsBoolean()
  @IsOptional()
  isListed?: boolean;
}"""

    new_settings_block = """  @ApiPropertyOptional({ description: 'Whether project appears in Discover/search' })
  @IsBoolean()
  @IsOptional()
  isListed?: boolean;

  @ApiPropertyOptional({ description: 'Alias for isListed; whether project appears in Discover/search' })
  @IsBoolean()
  @IsOptional()
  discoverable?: boolean;

  @ApiPropertyOptional({
    description: 'Public spectator access mode',
    enum: ['none', 'view_only', 'suggestions'],
    default: 'none',
  })
  @IsString()
  @IsOptional()
  publicAccessMode?: 'none' | 'view_only' | 'suggestions';

  @ApiPropertyOptional({
    description: 'Legacy alias for publicAccessMode',
    enum: ['none', 'view_only', 'suggestions', 'view', 'suggest'],
    default: 'none',
  })
  @IsString()
  @IsOptional()
  spectatorMode?: 'none' | 'view_only' | 'suggestions' | 'view' | 'suggest';

  @ApiPropertyOptional({ description: 'Whether public spectators can submit suggestions' })
  @IsBoolean()
  @IsOptional()
  suggestionsEnabled?: boolean;
}"""

    if "publicAccessMode?: 'none' | 'view_only' | 'suggestions';" not in source:
        if old_settings_block not in source:
            fail("Could not find CreateProjectSettingsDto isListed block to extend.")
        source = source.replace(old_settings_block, new_settings_block, 1)
        print("[wire_create_project_dto_public_listing] added settings-level public listing fields")
    else:
        print("[wire_create_project_dto_public_listing] settings-level fields already present")

    # 2) Add top-level public/listing/spectator fields after top-level isPublic.
    old_top_level_public_block = """  // ✅ ADDED: Direct isPublic flag from frontend
  @ApiPropertyOptional({
    description: 'Whether project is publicly viewable',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  // ─────────────────────────────────────────────────────────────────────────────
  // OPTIONAL FIELDS - ORGANIZATION
  // ─────────────────────────────────────────────────────────────────────────────"""

    new_top_level_public_block = """  // ✅ ADDED: Direct isPublic flag from frontend
  @ApiPropertyOptional({
    description: 'Whether project is publicly viewable',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Whether project appears in Discover/search',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isListed?: boolean;

  @ApiPropertyOptional({
    description: 'Alias for isListed; whether project appears in Discover/search',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  discoverable?: boolean;

  @ApiPropertyOptional({
    description: 'Public spectator access mode',
    enum: ['none', 'view_only', 'suggestions'],
    default: 'none',
  })
  @IsString()
  @IsOptional()
  publicAccessMode?: 'none' | 'view_only' | 'suggestions';

  @ApiPropertyOptional({
    description: 'Legacy alias for publicAccessMode from frontend',
    enum: ['none', 'view_only', 'suggestions', 'view', 'suggest'],
    default: 'none',
  })
  @IsString()
  @IsOptional()
  spectatorMode?: 'none' | 'view_only' | 'suggestions' | 'view' | 'suggest';

  @ApiPropertyOptional({
    description: 'Whether public spectators can submit suggestions',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  suggestionsEnabled?: boolean;

  // ─────────────────────────────────────────────────────────────────────────────
  // OPTIONAL FIELDS - ORGANIZATION
  // ─────────────────────────────────────────────────────────────────────────────"""

    if "discoverable?: boolean;" not in source.split("export class CreateProjectDto {", 1)[1]:
        if old_top_level_public_block not in source:
            fail("Could not find top-level isPublic block to extend.")
        source = source.replace(old_top_level_public_block, new_top_level_public_block, 1)
        print("[wire_create_project_dto_public_listing] added top-level public listing fields")
    else:
        print("[wire_create_project_dto_public_listing] top-level fields already present")

    required_after = [
        "discoverable?: boolean;",
        "publicAccessMode?: 'none' | 'view_only' | 'suggestions';",
        "spectatorMode?: 'none' | 'view_only' | 'suggestions' | 'view' | 'suggest';",
        "suggestionsEnabled?: boolean;",
        "Alias for isListed; whether project appears in Discover/search",
        "Public spectator access mode",
        "Legacy alias for publicAccessMode",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    if source == original:
        print("[wire_create_project_dto_public_listing] no changes needed")
        return

    backup = TARGET.with_name(f"{TARGET.name}.bak-public-listing-dto-{STAMP}")
    backup.write_text(original, encoding="utf-8")
    print(f"[wire_create_project_dto_public_listing] backup created: {backup}")

    TARGET.write_text(source, encoding="utf-8")
    print(f"[wire_create_project_dto_public_listing] patched: {TARGET}")

    print("")
    print("[wire_create_project_dto_public_listing] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"isListed|discoverable|publicAccessMode|spectatorMode|suggestionsEnabled|CreateProjectSettingsDto|CreateProjectDto\" src/projects/dto/create-project.dto.ts -C 8")
    print("  git diff -- src/projects/dto/create-project.dto.ts")


if __name__ == "__main__":
    main()
