from pathlib import Path
from datetime import datetime

service_path = Path("src/projects/projects.service.ts")
controller_path = Path("src/projects/projects.controller.ts")

service = service_path.read_text()
controller = controller_path.read_text()

service_backup = service_path.with_suffix(
    service_path.suffix + f".bak-before-home-ship-member-permission-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
controller_backup = controller_path.with_suffix(
    controller_path.suffix + f".bak-before-home-ship-route-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)

service_backup.write_text(service)
controller_backup.write_text(controller)

print(f"✅ Backup created: {service_backup}")
print(f"✅ Backup created: {controller_backup}")

old_permission = """    if (!this.canEdit(project, args.userId)) {
      throw new ForbiddenException('You do not have permission to post updates for this project');
    }"""

new_permission = """    // Ship updates are lightweight project activity, not full project closeout/editing.
    // Owners and real project members may post ship updates.
    // Public spectators still cannot post because they are not owners/members.
    if (!this.isProjectOwner(project, args.userId) && !this.isProjectMember(project, args.userId)) {
      throw new ForbiddenException('You do not have permission to post updates for this project');
    }"""

if old_permission not in service:
    raise SystemExit("❌ Could not find recordShipUpdate() canEdit permission block. No changes written.")

service = service.replace(old_permission, new_permission, 1)

if "@Post(':id/ships')" not in controller:
    marker = "\n  @Post(':id/complete')"

    if marker not in controller:
        raise SystemExit("❌ Could not find @Post(':id/complete') marker in projects.controller.ts. No controller changes written.")

    route = """
  @Post(':id/ships')
  @ApiOperation({ summary: 'Record a lightweight project ship update' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  async recordShipUpdate(
    @Req() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() body: { title?: string; description?: string; projectName?: string },
  ) {
    const userId = req.user?.sub || req.user?.userId;

    const shipTitle =
      String(body?.title || body?.description || 'Home mission shipped').trim() ||
      'Home mission shipped';

    const result = await this.projectsService.recordShipUpdate({
      projectId: id,
      userId,
      shipTitle,
      projectNameOverride: body?.projectName,
    });

    return {
      success: true,
      data: result,
    };
  }

"""

    controller = controller.replace(marker, "\n" + route + "  @Post(':id/complete')", 1)
else:
    print("ℹ️ @Post(':id/ships') already exists. Controller route not duplicated.")

service_path.write_text(service)
controller_path.write_text(controller)

print("✅ recordShipUpdate() now allows project owners/members, not only canEdit users.")
print("✅ POST /projects/:id/ships route exists in projects.controller.ts.")
print("✅ Complete/closeout permissions remain protected.")
print("")
print("Inspect with:")
print("rg -n \"recordShipUpdate|id/ships|Home mission shipped|isProjectOwner\\(project, args.userId\\)|isProjectMember\\(project, args.userId\\)\" src/projects -C 8")
