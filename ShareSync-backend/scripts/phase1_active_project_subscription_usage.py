from pathlib import Path
from datetime import datetime
import sys

SERVICE = Path("src/subscriptions/subscriptions.service.ts")
CONTROLLER = Path("src/subscriptions/subscriptions.controller.ts")

def fail(message):
    print(f"[phase1_active_project_subscription_usage] ERROR: {message}")
    sys.exit(1)

def backup(path):
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_path = path.with_suffix(path.suffix + f".bak.before-active-project-usage-{stamp}")
    backup_path.write_text(path.read_text())
    return backup_path

def find_matching(text, open_index, open_char="(", close_char=")"):
    depth = 0
    for i in range(open_index, len(text)):
        ch = text[i]
        if ch == open_char:
            depth += 1
        elif ch == close_char:
            depth -= 1
            if depth == 0:
                return i
    return -1

def ensure_mongoose_import_name(text, name):
    import_marker = "from 'mongoose';"
    if import_marker not in text:
        import_marker = 'from "mongoose";'

    if import_marker not in text:
        fail("could not find mongoose import")

    start = text.rfind("import", 0, text.find(import_marker))
    end = text.find(import_marker) + len(import_marker)

    line = text[start:end]

    if name in line:
        return text

    if "{" in line and "}" in line:
        updated_line = line.replace("{", "{ " + name + ",", 1)
        return text[:start] + updated_line + text[end:]

    fail(f"could not safely add {name} to mongoose import")

def ensure_nest_mongoose_import(text):
    marker_single = "from '@nestjs/mongoose';"
    marker_double = 'from "@nestjs/mongoose";'

    marker = marker_single if marker_single in text else marker_double if marker_double in text else None

    if marker is None:
        return "import { InjectModel } from '@nestjs/mongoose';\n" + text

    start = text.rfind("import", 0, text.find(marker))
    end = text.find(marker) + len(marker)
    line = text[start:end]

    if "InjectModel" in line:
        return text

    if "{" in line and "}" in line:
        updated_line = line.replace("{", "{ InjectModel,", 1)
        return text[:start] + updated_line + text[end:]

    fail("could not safely add InjectModel import")

def insert_project_model_in_constructor(text):
    if "private readonly projectModel: Model<any>" in text or "private projectModel: Model<any>" in text:
        print("[skip] projectModel already injected in subscriptions.service.ts")
        return text

    constructor_index = text.find("constructor(")
    if constructor_index == -1:
        fail("could not find constructor in subscriptions.service.ts")

    open_index = text.find("(", constructor_index)
    close_index = find_matching(text, open_index, "(", ")")
    if close_index == -1:
        fail("could not find end of constructor params")

    before_params = text[:close_index]
    after_params = text[close_index:]

    stripped = before_params.rstrip()
    trailing_ws = before_params[len(stripped):]

    param = (
        "\n    @InjectModel('Project')\n"
        "    private readonly projectModel: Model<any>,"
    )

    if stripped.endswith("("):
        replacement = stripped + param + trailing_ws
    elif stripped.endswith(","):
        replacement = stripped + param + trailing_ws
    else:
        replacement = stripped + "," + param + trailing_ws

    print("[patched] injected Project model into SubscriptionsService constructor")
    return replacement + after_params

def patch_service():
    if not SERVICE.exists():
        fail(f"missing file: {SERVICE}")

    text = SERVICE.read_text()
    original = text
    b = backup(SERVICE)

    text = ensure_nest_mongoose_import(text)
    text = ensure_mongoose_import_name(text, "Model")
    text = ensure_mongoose_import_name(text, "Types")
    text = insert_project_model_in_constructor(text)

    helper = """
  // ─────────────────────────────────────────────────────────────────────────────
  // ACTIVE PROJECT USAGE COUNT BRIDGE
  // ─────────────────────────────────────────────────────────────────────────────
  // Subscription project limits are based on active operating capacity, not total
  // historical projects. Completed/archived projects remain visible but do not
  // consume a free-plan active project slot.
  private getActiveProjectUsageQuery(userId: string): Record<string, any> {
    const oid = new Types.ObjectId(userId);

    const inactiveProjectStatuses = [
      'completed',
      'done',
      'archived',
      'deleted',
      'COMPLETED',
      'DONE',
      'ARCHIVED',
      'DELETED',
    ];

    return {
      $and: [
        {
          $or: [
            { ownerId: oid },
            { owner: oid },
            { 'members.userId': oid },
            { 'members.user': oid },
          ],
        },
        {
          $or: [
            { completedAt: { $exists: false } },
            { completedAt: null },
          ],
        },
      ],
      isArchived: { $ne: true },
      status: { $nin: inactiveProjectStatuses },
    };
  }

  private async countActiveProjectsForUser(userId: string): Promise<number> {
    return this.projectModel.countDocuments(this.getActiveProjectUsageQuery(userId)).exec();
  }

"""

    marker = "  async checkLimit("
    if "ACTIVE PROJECT USAGE COUNT BRIDGE" not in text:
        if marker not in text:
            fail("could not find checkLimit marker in subscriptions.service.ts")
        text = text.replace(marker, helper + marker, 1)
        print("[patched] inserted active project usage helper methods")
    else:
        print("[skip] active project usage helper already present")

    old = "current = subscription.usage.projects || 0;"
    new = "current = await this.countActiveProjectsForUser(userId);"

    if new in text:
        print("[skip] checkLimit already uses live active project count")
    elif old in text:
        text = text.replace(old, new, 1)
        print("[patched] checkLimit(projects) now uses live active project count")
    else:
        fail("could not find project usage current assignment in checkLimit")

    SERVICE.write_text(text)

    updated = SERVICE.read_text()
    required = [
        "ACTIVE PROJECT USAGE COUNT BRIDGE",
        "private getActiveProjectUsageQuery",
        "private async countActiveProjectsForUser",
        "current = await this.countActiveProjectsForUser(userId);",
        "@InjectModel('Project')",
        "private readonly projectModel: Model<any>",
    ]

    for needle in required:
        if needle not in updated:
            fail(f"subscriptions.service.ts missing expected marker after patch: {needle}")

    print(f"[patched] subscriptions.service.ts backup created: {b}")

def replace_project_access_query(text):
    marker = "const projectAccessQuery = {"
    start = text.find(marker)

    if start == -1:
        fail("could not find projectAccessQuery in subscriptions.controller.ts")

    brace_start = text.find("{", start)
    brace_end = find_matching(text, brace_start, "{", "}")

    if brace_end == -1:
        fail("could not find end of projectAccessQuery object")

    semi = text.find(";", brace_end)
    if semi == -1:
        fail("could not find semicolon after projectAccessQuery")

    replacement = """const inactiveProjectStatuses = [
      'completed',
      'done',
      'archived',
      'deleted',
      'COMPLETED',
      'DONE',
      'ARCHIVED',
      'DELETED',
    ];

    const projectAccessQuery = {
      $and: [
        {
          $or: [
            { ownerId: oid },
            { owner: oid },
            { 'members.userId': oid },
            { 'members.user': oid },
          ],
        },
        {
          $or: [
            { completedAt: { $exists: false } },
            { completedAt: null },
          ],
        },
      ],
      isArchived: { $ne: true },
      status: { $nin: inactiveProjectStatuses },
    }"""

    return text[:start] + replacement + text[semi:]

def patch_controller():
    if not CONTROLLER.exists():
        fail(f"missing file: {CONTROLLER}")

    text = CONTROLLER.read_text()
    b = backup(CONTROLLER)

    if "ACTIVE PROJECT USAGE COUNT BRIDGE" not in text:
        marker = "    // SUBSCRIPTION USAGE REALTIME BRIDGE"
        replacement = (
            "    // SUBSCRIPTION USAGE REALTIME BRIDGE\n"
            "    // ACTIVE PROJECT USAGE COUNT BRIDGE\n"
            "    // Count active operating projects only. Completed and archived projects\n"
            "    // remain visible but do not consume free-plan project capacity."
        )

        if marker in text:
            text = text.replace(marker, replacement, 1)
        else:
            print("[warn] subscription realtime bridge comment not found; continuing with query patch")

    if "const inactiveProjectStatuses = [" in text and "status: { $nin: inactiveProjectStatuses }" in text:
        print("[skip] subscriptions.controller.ts active project query already patched")
    else:
        text = replace_project_access_query(text)
        print("[patched] subscriptions.controller.ts current usage count now excludes completed/archived projects")

    CONTROLLER.write_text(text)

    updated = CONTROLLER.read_text()
    required = [
        "ACTIVE PROJECT USAGE COUNT BRIDGE",
        "const inactiveProjectStatuses = [",
        "completedAt: { $exists: false }",
        "status: { $nin: inactiveProjectStatuses }",
        "projects: realProjectCount",
    ]

    for needle in required:
        if needle not in updated:
            fail(f"subscriptions.controller.ts missing expected marker after patch: {needle}")

    print(f"[patched] subscriptions.controller.ts backup created: {b}")

def main():
    print("[phase1_active_project_subscription_usage] starting")
    patch_service()
    patch_controller()
    print()
    print("[phase1_active_project_subscription_usage] complete")
    print()
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "ACTIVE PROJECT USAGE COUNT BRIDGE|countActiveProjectsForUser|getActiveProjectUsageQuery|inactiveProjectStatuses|usage\\.projects|current = await this\\.countActiveProjectsForUser|projects: realProjectCount" src/subscriptions -C 8')
    print("  git diff -- src/subscriptions/subscriptions.service.ts src/subscriptions/subscriptions.controller.ts")

if __name__ == "__main__":
    main()
