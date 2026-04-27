#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-backend")
TARGET = ROOT / "src/app.module.ts"
SPRINTS_MODULE = ROOT / "src/sprints/sprints.module.ts"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[register_sprints_module] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def backup(path: Path):
    backup_path = path.with_name(f"{path.name}.bak-register-sprints-module-{STAMP}")
    backup_path.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")
    print(f"[register_sprints_module] backup created: {backup_path}")


def insert_import(source: str) -> str:
    import_line = "import { SprintsModule } from './sprints/sprints.module';\n"

    if import_line in source:
        print("[register_sprints_module] SprintsModule import already exists")
        return source

    if "SprintsModule" in source:
        fail("Found SprintsModule text, but not the expected import line. Please inspect app.module.ts manually.")

    # Prefer placing near ProjectsModule if present.
    project_imports = [
        "import { ProjectsModule } from './projects/projects.module';\n",
        'import { ProjectsModule } from "./projects/projects.module";\n',
    ]

    for marker in project_imports:
        if marker in source:
            print("[register_sprints_module] inserted import after ProjectsModule import")
            return source.replace(marker, marker + import_line, 1)

    # Fallback: insert after the last import line.
    lines = source.splitlines(keepends=True)
    last_import_index = -1

    for index, line in enumerate(lines):
      if line.startswith("import "):
        last_import_index = index

    if last_import_index == -1:
        fail("Could not locate import section in app.module.ts.")

    lines.insert(last_import_index + 1, import_line)
    print("[register_sprints_module] inserted import after last import")
    return "".join(lines)


def add_to_imports_array(source: str) -> str:
    if "SprintsModule," in source:
        print("[register_sprints_module] SprintsModule already appears in imports array")
        return source

    # Prefer placing after ProjectsModule in the @Module imports array.
    project_module_markers = [
        "    ProjectsModule,\n",
        "    ProjectsModule\n",
  ]

    for marker in project_module_markers:
        if marker in source:
            replacement = marker
            if not marker.endswith(",\n"):
                replacement = "    ProjectsModule,\n"

            print("[register_sprints_module] inserted SprintsModule after ProjectsModule")
            return source.replace(marker, replacement + "    SprintsModule,\n", 1)

    # Fallback: insert immediately after "imports: ["
    marker = "  imports: [\n"
    if marker in source:
        print("[register_sprints_module] inserted SprintsModule at top of imports array")
        return source.replace(marker, marker + "    SprintsModule,\n", 1)

    marker_alt = "imports: [\n"
    if marker_alt in source:
        print("[register_sprints_module] inserted SprintsModule at top of imports array")
        return source.replace(marker_alt, marker_alt + "    SprintsModule,\n", 1)

    fail("Could not locate AppModule imports array.")


def main():
    print("[register_sprints_module] starting")

    if not TARGET.exists():
        fail(f"Missing app.module.ts: {TARGET}")

    if not SPRINTS_MODULE.exists():
        fail(f"Missing SprintsModule file: {SPRINTS_MODULE}")

    source = TARGET.read_text(encoding="utf-8")
    original = source

    required_before = [
        "@Module",
        "imports:",
        "export class AppModule",
    ]

    for marker in required_before:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}")

    source = insert_import(source)
    source = add_to_imports_array(source)

    required_after = [
        "import { SprintsModule } from './sprints/sprints.module';",
        "SprintsModule,",
        "export class AppModule",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    if source == original:
        print("[register_sprints_module] no changes needed")
        return

    backup(TARGET)
    TARGET.write_text(source, encoding="utf-8")
    print(f"[register_sprints_module] patched: {TARGET}")

    print("")
    print("[register_sprints_module] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"SprintsModule|sprints.module|imports:\" src/app.module.ts -C 6")
    print("  git diff -- src/app.module.ts")


if __name__ == "__main__":
    main()
