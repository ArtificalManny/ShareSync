from pathlib import Path
from datetime import datetime
import re
import sys

STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")

SCHEMA = Path("src/projects/schemas/project.schema.ts")
DTO = Path("src/projects/dto/update-project.dto.ts")
CONTROLLER = Path("src/projects/projects.controller.ts")


def fail(message: str) -> None:
    print(f"[patch_project_branding_backend] ERROR: {message}")
    sys.exit(1)


def backup(path: Path) -> Path:
    if not path.exists():
        fail(f"missing file: {path}")
    backup_path = path.with_suffix(path.suffix + f".bak.before-project-branding-{STAMP}")
    backup_path.write_text(path.read_text())
    return backup_path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        fail(f"{label}: expected 1 match, found {count}")
    return text.replace(old, new, 1)


def add_named_import(text: str, module_name: str, names_to_add: list[str]) -> str:
    pattern = re.compile(
        r"import\s*\{(?P<body>[\s\S]*?)\}\s*from\s*['\"]"
        + re.escape(module_name)
        + r"['\"];",
        re.MULTILINE,
    )

    match = pattern.search(text)
    if not match:
        fail(f"could not find named import from {module_name}")

    body = match.group("body")
    existing = {
        item.strip()
        for item in body.replace("\n", " ").split(",")
        if item.strip()
    }

    missing = [name for name in names_to_add if name not in existing]
    if not missing:
        return text

    cleaned_items = [item.strip() for item in body.split(",") if item.strip()]
    cleaned_items.extend(missing)

    new_body = "\n  " + ",\n  ".join(cleaned_items) + ",\n"
    new_import = f"import {{{new_body}}} from '{module_name}';"

    return text[:match.start()] + new_import + text[match.end():]


def insert_after_last_import(text: str, import_line: str) -> str:
    if import_line in text:
        return text

    imports = list(re.finditer(r"^import\s+[\s\S]*?;\n", text, re.MULTILINE))
    if not imports:
        fail("could not find imports block")

    last = imports[-1]
    return text[:last.end()] + import_line + text[last.end():]


def patch_schema() -> None:
    print("[patch] project.schema.ts")
    text = SCHEMA.read_text()

    if "logoUrl?: string;" in text and "bannerUrl?: string;" in text:
        print("[skip] schema branding fields already present")
        return

    backup_path = backup(SCHEMA)

    old = """  @Prop({ type: String, default: '📁' })
  icon: string;

  @Prop({ type: String, default: '#7C3AED' })
  color: string;
"""

    new = """  @Prop({ type: String, default: '📁' })
  icon: string;

  // ─────────────────────────────────────────────────────────────────────────────
  // PROJECT BRANDING
  // ─────────────────────────────────────────────────────────────────────────────
  // logoUrl is the image/profile-style project logo shown in ProjectAvatar.
  // bannerUrl is the wide visual banner shown on ProjectHome / settings.
  // These are stored as relative upload URLs such as /uploads/project-branding-...
  // so the frontend can resolve them against the backend asset origin.
  @Prop({ type: String, default: '' })
  logoUrl?: string;

  @Prop({ type: String, default: '' })
  bannerUrl?: string;

  @Prop({ type: String, default: '#7C3AED' })
  color: string;
"""

    text = replace_once(text, old, new, "schema branding insertion")
    SCHEMA.write_text(text)
    print(f"[patched] schema backup created: {backup_path}")


def patch_dto() -> None:
    print("[patch] update-project.dto.ts")
    text = DTO.read_text()

    if "logoUrl?: string;" in text and "bannerUrl?: string;" in text:
        print("[skip] dto branding fields already present")
        return

    backup_path = backup(DTO)

    old = """  @ApiPropertyOptional({
    description: 'Project emoji (preferred)',
    example: '🚀',
  })
  @IsString()
  @IsOptional()
  emoji?: string;

  @ApiPropertyOptional({
    description: 'Project color (hex)',
    example: '#7C3AED',
  })
"""

    new = """  @ApiPropertyOptional({
    description: 'Project emoji (preferred)',
    example: '🚀',
  })
  @IsString()
  @IsOptional()
  emoji?: string;

  @ApiPropertyOptional({
    description: 'Project logo/profile image URL. Relative upload URLs are allowed.',
    example: '/uploads/project-branding-1710000000000-ab12cd34.png',
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  logoUrl?: string;

  @ApiPropertyOptional({
    description: 'Project banner image URL. Relative upload URLs are allowed.',
    example: '/uploads/project-branding-1710000000000-ab12cd34.png',
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  bannerUrl?: string;

  @ApiPropertyOptional({
    description: 'Project color (hex)',
    example: '#7C3AED',
  })
"""

    text = replace_once(text, old, new, "dto branding insertion")
    DTO.write_text(text)
    print(f"[patched] dto backup created: {backup_path}")


def patch_controller() -> None:
    print("[patch] projects.controller.ts")
    text = CONTROLLER.read_text()

    if "PROJECT BRANDING UPLOAD BRIDGE" in text:
        print("[skip] controller branding upload endpoint already present")
        return

    backup_path = backup(CONTROLLER)

    text = add_named_import(
        text,
        "@nestjs/common",
        ["UploadedFile", "BadRequestException"],
    )
    text = add_named_import(
        text,
        "@nestjs/swagger",
        ["ApiConsumes", "ApiBody"],
    )

    text = insert_after_last_import(
        text,
        "import { FileInterceptor } from '@nestjs/platform-express';\n",
    )
    text = insert_after_last_import(
        text,
        "import { diskStorage } from 'multer';\n",
    )
    text = insert_after_last_import(
        text,
        "import * as path from 'node:path';\n",
    )
    text = insert_after_last_import(
        text,
        "import * as fs from 'node:fs';\n",
    )

    helper_block = """
// ─────────────────────────────────────────────────────────────────────────────
// PROJECT BRANDING UPLOAD BRIDGE
// ─────────────────────────────────────────────────────────────────────────────
// Purpose:
// - Let project owners/admins upload a logo/profile image or banner image.
// - Store the file in the existing /uploads folder.
// - Save the resulting relative URL on the Project document via ProjectsService.update.
// - Keep permission checks centralized in ProjectsService.update.
const PROJECT_BRANDING_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const PROJECT_BRANDING_UPLOAD_DIR = path.join(process.cwd(), 'uploads');

function ensureProjectBrandingUploadDir() {
  fs.mkdirSync(PROJECT_BRANDING_UPLOAD_DIR, { recursive: true });
}

function safeProjectBrandingExtension(originalName = '') {
  const ext = path.extname(originalName || '').toLowerCase();
  return ext && /^[.a-z0-9]+$/.test(ext) ? ext : '.png';
}

const projectBrandingDiskStorage = diskStorage({
  destination: (_req, _file, cb) => {
    ensureProjectBrandingUploadDir();
    cb(null, PROJECT_BRANDING_UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = safeProjectBrandingExtension(file.originalname);
    const suffix = Math.random().toString(36).slice(2, 10);
    cb(null, `project-branding-${Date.now()}-${suffix}${ext}`);
  },
});

function projectBrandingFileFilter(
  _req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) {
  if (!file?.mimetype?.startsWith('image/')) {
    cb(new BadRequestException('Only image uploads are allowed for project branding.'), false);
    return;
  }

  cb(null, true);
}

"""

    text = text.replace("\n@ApiTags('Projects')", "\n" + helper_block + "@ApiTags('Projects')", 1)

    endpoint_block = """  // ─────────────────────────────────────────────────────────────────────────────
  // PROJECT BRANDING IMAGE UPLOAD
  // ─────────────────────────────────────────────────────────────────────────────

  @Post(':id/branding-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: projectBrandingDiskStorage,
      fileFilter: projectBrandingFileFilter,
      limits: { fileSize: PROJECT_BRANDING_MAX_FILE_SIZE },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a project logo or banner image' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
        kind: {
          type: 'string',
          enum: ['logo', 'banner'],
          default: 'logo',
        },
      },
    },
  })
  async uploadBrandingImage(
    @Req() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('kind') kind?: string,
  ) {
    const userId = req.user?.sub || req.user?.userId;

    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    const normalizedKind = String(kind || 'logo').toLowerCase() === 'banner'
      ? 'banner'
      : 'logo';

    const url = `/uploads/${file.filename}`;

    const project = await this.projectsService.update(
      id,
      userId,
      normalizedKind === 'banner'
        ? ({ bannerUrl: url } as UpdateProjectDto)
        : ({ logoUrl: url } as UpdateProjectDto),
    );

    return {
      success: true,
      data: {
        kind: normalizedKind,
        url,
        project,
      },
    };
  }

"""

    update_marker = """  // ─────────────────────────────────────────────────────────────────────────────
  // UPDATE
"""
    if update_marker not in text:
        fail("could not find UPDATE section marker in projects.controller.ts")

    text = text.replace(update_marker, endpoint_block + update_marker, 1)

    CONTROLLER.write_text(text)
    print(f"[patched] controller backup created: {backup_path}")


def main() -> None:
    print("[patch_project_branding_backend] starting")
    patch_schema()
    patch_dto()
    patch_controller()
    print()
    print("[patch_project_branding_backend] complete")
    print()
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "PROJECT BRANDING UPLOAD BRIDGE|logoUrl|bannerUrl|branding-image|FileInterceptor|UploadedFile|ApiConsumes|ApiBody" src/projects -C 8')
    print("  git diff -- src/projects/schemas/project.schema.ts src/projects/dto/update-project.dto.ts src/projects/projects.controller.ts")


if __name__ == "__main__":
    main()
