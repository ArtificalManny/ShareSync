from pathlib import Path

service_path = Path("src/projects/invites.service.ts")
controller_path = Path("src/projects/invites.controller.ts")

if not service_path.exists():
    raise SystemExit(f"Missing file: {service_path}")

if not controller_path.exists():
    raise SystemExit(f"Missing file: {controller_path}")

service = service_path.read_text()

old_permission_block = """  private assertOwnerOrThrow(project: ProjectDocument, actingUserId: string) {
    const acting = String(actingUserId);

    // ownerId is the canonical owner field in your schema
    if (this.getId(project.ownerId) === acting) return;

    // You *can* choose to allow ADMINs too; for now, keep strict "owner only"
    const isOwnerMember =
      (project.members || []).some(
        (m) => this.getId(m.userId) === acting && m.role === MemberRole.OWNER,
      );

    if (!isOwnerMember) {
      throw new ForbiddenException('Only owners can manage invites.');
    }
  }"""

new_permission_block = """  private getProjectMemberRole(project: any, actingUserId: string): string {
    const acting = String(actingUserId || '');

    const member = (project.members || []).find((m: any) => {
      const memberUserId = this.getId(m?.userId || m?.user || m?.memberId || m);
      return memberUserId === acting;
    });

    return String(member?.role || '').toLowerCase();
  }

  private canManageInvites(project: any, actingUserId: string): boolean {
    const acting = String(actingUserId || '');

    if (!acting) return false;

    // Project owner always manages invites.
    if (this.getId(project.ownerId || project.owner) === acting) {
      return true;
    }

    const role = this.getProjectMemberRole(project, acting);

    // Treat admin/moderator/manager as invite-capable.
    return ['owner', 'admin', 'moderator', 'manager'].includes(role);
  }

  private assertCanManageInvitesOrThrow(project: ProjectDocument, actingUserId: string) {
    if (this.canManageInvites(project, actingUserId)) {
      return;
    }

    throw new ForbiddenException('Only project owners or admins can manage invites.');
  }"""

if old_permission_block not in service:
    raise SystemExit("Could not find old assertOwnerOrThrow block.")

service = service.replace(old_permission_block, new_permission_block)

service = service.replace(
    "this.assertOwnerOrThrow(project, actingUserId);",
    "this.assertCanManageInvitesOrThrow(project, actingUserId);"
)

old_list = """  async listInvites(projectId: string, _actingUserId: string) {
    const project = await this.projectModel.findById(projectId).lean();
    if (!project) throw new NotFoundException('Project not found');

    return (project.invites || []).map((i: any) => ({
      email: i.email,
      role: i.role,
      status: i.status,
      token: i.token,
      createdAt: i.createdAt,
      expiresAt: i.expiresAt,
      invitedBy: i.invitedBy,
      acceptedByUserId: i.acceptedByUserId,
    }));
  }"""

new_list = """  async listInvites(projectId: string, actingUserId: string) {
    const project = await this.projectModel.findById(projectId);
    if (!project) throw new NotFoundException('Project not found');

    this.assertCanManageInvitesOrThrow(project, actingUserId);

    return (project.invites || []).map((i: any) => ({
      email: i.email,
      role: i.role,
      status: i.status,
      token: i.token,
      createdAt: i.createdAt,
      expiresAt: i.expiresAt,
      invitedBy: i.invitedBy,
      acceptedByUserId: i.acceptedByUserId,
    }));
  }"""

if old_list not in service:
    raise SystemExit("Could not find listInvites block.")

service = service.replace(old_list, new_list)

email_guard_anchor = """    if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
      invite.status = 'expired';
      await project.save();
      throw new BadRequestException('Invite has expired.');
    }

    const alreadyMember ="""

email_guard = """    if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
      invite.status = 'expired';
      await project.save();
      throw new BadRequestException('Invite has expired.');
    }

    const inviteEmail = String((invite as any).email || '').trim().toLowerCase();
    const accountEmail = String(userEmail || '').trim().toLowerCase();

    if (inviteEmail && !accountEmail) {
      throw new ForbiddenException('You must be logged in as the invited email address to accept this invite.');
    }

    if (inviteEmail && accountEmail && inviteEmail !== accountEmail) {
      throw new ForbiddenException('This invite was sent to a different email address.');
    }

    const alreadyMember ="""

if email_guard_anchor not in service:
    raise SystemExit("Could not find acceptInvite email guard anchor.")

service = service.replace(email_guard_anchor, email_guard, 1)

service_path.write_text(service)

# The service now enforces invite permissions itself.
# Remove ProjectPermissionGuard from invite routes to avoid a generic project guard blocking valid admins.
controller = controller_path.read_text()
controller = controller.replace(
    "@UseGuards(JwtAuthGuard, ProjectPermissionGuard /*, CanManageProject */)",
    "@UseGuards(JwtAuthGuard)"
)

controller = controller.replace(
    "  import { ProjectPermissionGuard } from './guards/project-permission.guard';\n",
    ""
)

controller_path.write_text(controller)

print("Patched invite permissions: owners/admins can manage invites; accept requires invited email.")
