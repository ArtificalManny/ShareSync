#!/usr/bin/env python3
from pathlib import Path
import shutil
import sys

ROOT = Path.cwd()
TARGET = ROOT / "src/projects/projects.controller.ts"
BACKUP = ROOT / "src/projects/projects.controller.ts.bak.before-display-role-endpoint"


def fail(message: str) -> None:
    print(f"\n[add_member_display_role_controller_endpoint] ERROR: {message}")
    sys.exit(1)


def main() -> None:
    print("[add_member_display_role_controller_endpoint] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")

    if "display-role" in source or "updateMemberDisplayRole" in source:
        fail("Display-role controller endpoint already appears to exist. Refusing to patch twice.")

    old = """  @Patch(':id/members/:userId/role')
  @ApiOperation({ summary: 'Update member role' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiParam({ name: 'userId', description: 'User ID to update' })
  async updateMemberRole(
    @Req() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('userId', ParseObjectIdPipe) memberUserId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    const userId = req.user?.sub || req.user?.userId;

    const project = await this.projectsService.updateMemberRole(
      id,
      userId,
      memberUserId,
      dto,
    );

    return {
      success: true,
      data: project,
    };
  }

  @Patch(':id/preferences')"""

    new = """  @Patch(':id/members/:userId/role')
  @ApiOperation({ summary: 'Update member permission role' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiParam({ name: 'userId', description: 'User ID to update' })
  async updateMemberRole(
    @Req() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('userId', ParseObjectIdPipe) memberUserId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    const userId = req.user?.sub || req.user?.userId;

    const project = await this.projectsService.updateMemberRole(
      id,
      userId,
      memberUserId,
      dto,
    );

    return {
      success: true,
      data: project,
    };
  }

  @Patch(':id/members/:userId/display-role')
  @ApiOperation({ summary: 'Update member display role label' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiParam({ name: 'userId', description: 'User ID to update' })
  async updateMemberDisplayRole(
    @Req() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('userId', ParseObjectIdPipe) memberUserId: string,
    @Body('displayRole') displayRole: string,
  ) {
    const userId = req.user?.sub || req.user?.userId;

    const project = await this.projectsService.updateMemberDisplayRole(
      id,
      userId,
      memberUserId,
      displayRole,
    );

    return {
      success: true,
      data: project,
    };
  }

  @Patch(':id/preferences')"""

    count = source.count(old)
    if count != 1:
        fail(f"Expected exact updateMemberRole block once, found {count}")

    edited = source.replace(old, new, 1)

    required_markers = [
        "@Patch(':id/members/:userId/display-role')",
        "Update member display role label",
        "async updateMemberDisplayRole(",
        "@Body('displayRole') displayRole: string",
        "this.projectsService.updateMemberDisplayRole(",
        "Update member permission role",
    ]

    for marker in required_markers:
        if marker not in edited:
            fail(f"Prewrite verification failed. Missing marker: {marker}")

    if not BACKUP.exists():
        shutil.copy2(TARGET, BACKUP)
        print(f"[add_member_display_role_controller_endpoint] backup created: {BACKUP}")
    else:
        print(f"[add_member_display_role_controller_endpoint] backup already exists, preserved: {BACKUP}")

    TARGET.write_text(edited, encoding="utf-8")

    updated = TARGET.read_text(encoding="utf-8")
    for marker in required_markers:
        if marker not in updated:
            fail(f"Post-edit verification failed. Missing marker after write: {marker}")

    print("\n[add_member_display_role_controller_endpoint] complete")
    print("\nNext checks:")
    print("  npm run build")
    print("  rg -n \"display-role|updateMemberDisplayRole|Update member display role label|Update member permission role|members/:userId/role\" src/projects/projects.controller.ts -C 6")
    print("  git diff -- src/projects/projects.controller.ts")


if __name__ == "__main__":
    main()
