#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-backend")
TARGET = ROOT / "src/sprints/sprints.module.ts"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")

MODULE_FILE = r'''// src/sprints/sprints.module.ts
// ═══════════════════════════════════════════════════════════════════════════════
// SPRINTS MODULE
// Registers the Sprint model, controller, and service.
//
// Safe first-pass purpose:
// - Keep sprint backend isolated.
// - Do not import ProjectsModule until SprintsService actually injects it.
// - Do not call ScheduleModule.forRoot() here to avoid duplicate scheduler setup.
// ═══════════════════════════════════════════════════════════════════════════════

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Sprint, SprintSchema } from './schemas/sprint.schema';
import { SprintsController } from './sprints.controller';
import { SprintsService } from './sprints.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Sprint.name,
        schema: SprintSchema,
      },
    ]),
  ],
  controllers: [SprintsController],
  providers: [SprintsService],
  exports: [SprintsService],
})
export class SprintsModule {}
'''

def fail(message: str):
    print(f"\n[write_sprints_module] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[write_sprints_module] starting")

    if not ROOT.exists():
        fail(f"Backend root does not exist: {ROOT}")

    required_files = [
        ROOT / "src/sprints/schemas/sprint.schema.ts",
        ROOT / "src/sprints/sprints.controller.ts",
        ROOT / "src/sprints/sprints.service.ts",
    ]

    for path in required_files:
        if not path.exists():
            fail(f"Missing required sprint file before module write: {path}")

    TARGET.parent.mkdir(parents=True, exist_ok=True)

    if TARGET.exists():
        backup_path = TARGET.with_name(f"{TARGET.name}.bak-sprints-module-{STAMP}")
        backup_path.write_text(TARGET.read_text(encoding="utf-8"), encoding="utf-8")
        print(f"[write_sprints_module] backup created: {backup_path}")

    TARGET.write_text(MODULE_FILE, encoding="utf-8")
    print(f"[write_sprints_module] wrote: {TARGET}")

    written = TARGET.read_text(encoding="utf-8")

    required = [
        "export class SprintsModule",
        "MongooseModule.forFeature",
        "name: Sprint.name",
        "schema: SprintSchema",
        "controllers: [SprintsController]",
        "providers: [SprintsService]",
        "exports: [SprintsService]",
    ]

    for marker in required:
        if marker not in written:
            fail(f"Safety check failed. Missing marker: {marker}")

    forbidden = [
        "ScheduleModule.forRoot",
        "ProjectsModule",
        "projects.module",
    ]

    for marker in forbidden:
        if marker in written:
            fail(f"Safety check failed. Forbidden unnecessary module dependency found: {marker}")

    print("")
    print("[write_sprints_module] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"SprintsModule|MongooseModule.forFeature|SprintSchema|SprintsController|SprintsService|ProjectsModule|ScheduleModule\" src/sprints/sprints.module.ts -C 4")
    print("  git diff -- src/sprints/sprints.module.ts")

if __name__ == "__main__":
    main()
