#!/usr/bin/env python3
from pathlib import Path
import shutil
import sys

ROOT = Path.cwd()
TARGET = ROOT / "src/projects/schemas/project.schema.ts"
BACKUP = ROOT / "src/projects/schemas/project.schema.ts.bak.before-display-role"


def fail(message: str) -> None:
    print(f"\n[add_project_member_display_role_schema] ERROR: {message}")
    sys.exit(1)


def main() -> None:
    print("[add_project_member_display_role_schema] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")

    if "displayRole?: string;" in source:
        fail("displayRole already appears to exist in project.schema.ts. Refusing to patch twice.")

    old = '''  @Prop({ type: String, enum: MemberRole, default: MemberRole.MEMBER })
  role: MemberRole;

  @Prop({ type: Date, default: Date.now })
  joinedAt: Date;'''

    new = '''  @Prop({ type: String, enum: MemberRole, default: MemberRole.MEMBER })
  role: MemberRole;

  // Human-facing project role label shown in the UI.
  // This is NOT a permission role. Permissions still come from `role`.
  // Examples: "Manager", "Boss", "Developer", "Frontend Lead".
  @Prop({ type: String, trim: true, maxlength: 40, default: '' })
  displayRole?: string;

  @Prop({ type: Date, default: Date.now })
  joinedAt: Date;'''

    count = source.count(old)
    if count != 1:
        fail(f"Expected exact ProjectMember role/joinedAt block once, found {count}")

    edited = source.replace(old, new, 1)

    required_markers = [
        "displayRole?: string;",
        "Human-facing project role label shown in the UI.",
        "This is NOT a permission role.",
        "maxlength: 40",
    ]

    for marker in required_markers:
        if marker not in edited:
            fail(f"Post-edit prewrite verification failed. Missing marker: {marker}")

    if not BACKUP.exists():
        shutil.copy2(TARGET, BACKUP)
        print(f"[add_project_member_display_role_schema] backup created: {BACKUP}")
    else:
        print(f"[add_project_member_display_role_schema] backup already exists, preserved: {BACKUP}")

    TARGET.write_text(edited, encoding="utf-8")

    updated = TARGET.read_text(encoding="utf-8")
    for marker in required_markers:
        if marker not in updated:
            fail(f"Post-edit verification failed. Missing marker after write: {marker}")

    print("\n[add_project_member_display_role_schema] complete")
    print("\nNext checks:")
    print("  npm run build")
    print("  rg -n \"displayRole|Human-facing project role label|role: MemberRole|ProjectMember\" src/projects/schemas/project.schema.ts -C 6")
    print("  git diff -- src/projects/schemas/project.schema.ts")


if __name__ == "__main__":
    main()
