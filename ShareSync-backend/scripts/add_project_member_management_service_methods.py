#!/usr/bin/env python3
from pathlib import Path
import shutil
import sys

ROOT = Path.cwd()
TARGET = ROOT / "src/projects/projects.service.ts"
BACKUP = ROOT / "src/projects/projects.service.ts.bak.before-member-management-service"


def fail(message: str) -> None:
    print(f"\n[add_project_member_management_service_methods] ERROR: {message}")
    sys.exit(1)


def require_count(text: str, needle: str, expected: int, label: str) -> None:
    actual = text.count(needle)
    if actual != expected:
        fail(f"{label}: expected {expected} occurrence(s), found {actual}")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    require_count(text, old, 1, label)
    return text.replace(old, new, 1)


def main() -> None:
    print("[add_project_member_management_service_methods] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")

    if "updateMemberDisplayRole(" in source:
        fail("updateMemberDisplayRole already appears to exist. Refusing to patch twice.")

    edited = source

    old_import = """import { NotificationsService } from '../notifications/notifications.service';"""

    new_import = """import { NotificationsService } from '../notifications/notifications.service';
import { NotificationPriority, NotificationType } from '../notifications/schemas/notification.schema';"""

    edited = replace_once(
        edited,
        old_import,
        new_import,
        "notification schema import",
    )

    old_block = """  async removeMember(projectId: string, userId: string, memberUserId: string): Promise<ProjectDocument> {
    const project = await this.findByIdWithAccess(projectId, userId);

    if (!this.canManageMembers(project, userId)) {
      throw new ForbiddenException('You do not have permission to remove members');
    }

    if (project.ownerId.toString() === memberUserId) {
      throw new BadRequestException('Cannot remove project owner');
    }

    const memberIndex = project.members.findIndex((m) => m.userId.toString() === memberUserId);
    if (memberIndex === -1) throw new NotFoundException('Member not found in project');

    project.members.splice(memberIndex, 1);

    await this.projectModel.updateOne(
      { _id: new Types.ObjectId(projectId) },
      { $set: { 'metrics.memberCount': project.members.length + 1 } },
    );

    const updated = await project.save();

    this.eventEmitter.emit('project.member.removed', {
      projectId: updated._id,
      memberId: memberUserId,
      removedBy: userId,
    });

    return updated;
  }

  async updateMemberRole(projectId: string, userId: string, memberUserId: string, dto: UpdateMemberRoleDto): Promise<ProjectDocument> {
    const project = await this.findByIdWithAccess(projectId, userId);

    if (project.ownerId.toString() !== userId) {
      throw new ForbiddenException('Only the project owner can change member roles');
    }

    if (project.ownerId.toString() === memberUserId) {
      throw new BadRequestException('Cannot change owner role');
    }

    if (dto.role === MemberRole.OWNER) {
      throw new BadRequestException('Cannot assign owner role. Use transfer ownership instead.');
    }

    const member = project.members.find((m) => m.userId.toString() === memberUserId);
    if (!member) throw new NotFoundException('Member not found in project');

    member.role = dto.role;
    return project.save();
  }"""

    new_block = """  async removeMember(projectId: string, userId: string, memberUserId: string): Promise<ProjectDocument> {
    const project = await this.findByIdWithAccess(projectId, userId);

    if (!this.canManageMembers(project, userId)) {
      throw new ForbiddenException('You do not have permission to remove members');
    }

    if (project.ownerId.toString() === memberUserId) {
      throw new BadRequestException('Cannot remove project owner');
    }

    if (userId === memberUserId) {
      throw new BadRequestException('Use leave project instead of removing yourself');
    }

    const memberIndex = project.members.findIndex((m) => m.userId.toString() === memberUserId);
    if (memberIndex === -1) throw new NotFoundException('Member not found in project');

    const removedMember = project.members[memberIndex] as any;
    const removedDisplayRole = removedMember?.displayRole || removedMember?.role || MemberRole.MEMBER;

    project.members.splice(memberIndex, 1);

    await this.projectModel.updateOne(
      { _id: new Types.ObjectId(projectId) },
      { $set: { 'metrics.memberCount': project.members.length } },
    );

    const updated = await project.save();

    await this.notifyProjectMembersAboutMemberRemoval(
      updated,
      userId,
      memberUserId,
      removedDisplayRole,
    );

    this.eventEmitter.emit('project.member.removed', {
      projectId: updated._id,
      memberId: memberUserId,
      removedBy: userId,
    });

    this.eventEmitter.emit('project.members.changed', {
      projectId: updated._id,
      changedBy: userId,
      action: 'member_removed',
      memberId: memberUserId,
    });

    return updated;
  }

  async updateMemberRole(projectId: string, userId: string, memberUserId: string, dto: UpdateMemberRoleDto): Promise<ProjectDocument> {
    const project = await this.findByIdWithAccess(projectId, userId);

    if (project.ownerId.toString() !== userId) {
      throw new ForbiddenException('Only the project owner can change member roles');
    }

    if (project.ownerId.toString() === memberUserId) {
      throw new BadRequestException('Cannot change owner role');
    }

    if (dto.role === MemberRole.OWNER) {
      throw new BadRequestException('Cannot assign owner role. Use transfer ownership instead.');
    }

    const member = project.members.find((m) => m.userId.toString() === memberUserId);
    if (!member) throw new NotFoundException('Member not found in project');

    member.role = dto.role;
    const updated = await project.save();

    await this.notifyProjectMembersAboutPermissionRoleChange(
      updated,
      userId,
      memberUserId,
      dto.role,
    );

    this.eventEmitter.emit('project.members.changed', {
      projectId: updated._id,
      changedBy: userId,
      action: 'permission_role_updated',
      memberId: memberUserId,
      role: dto.role,
    });

    return updated;
  }

  async updateMemberDisplayRole(
    projectId: string,
    userId: string,
    memberUserId: string,
    displayRole: string,
  ): Promise<ProjectDocument> {
    const project = await this.findByIdWithAccess(projectId, userId);

    if (!this.canManageMembers(project, userId)) {
      throw new ForbiddenException('You do not have permission to manage member roles');
    }

    if (project.ownerId.toString() === memberUserId) {
      throw new BadRequestException('Owner display role is controlled by ownership');
    }

    const normalizedDisplayRole = this.normalizeMemberDisplayRole(displayRole);

    const memberIndex = project.members.findIndex((m) => m.userId.toString() === memberUserId);
    if (memberIndex === -1) throw new NotFoundException('Member not found in project');

    (project.members[memberIndex] as any).displayRole = normalizedDisplayRole;
    project.markModified(`members.${memberIndex}.displayRole`);

    const updated = await project.save();

    await this.notifyProjectMembersAboutDisplayRoleChange(
      updated,
      userId,
      memberUserId,
      normalizedDisplayRole,
    );

    this.eventEmitter.emit('project.member.display_role_updated', {
      projectId: updated._id,
      changedBy: userId,
      memberId: memberUserId,
      displayRole: normalizedDisplayRole,
    });

    this.eventEmitter.emit('project.members.changed', {
      projectId: updated._id,
      changedBy: userId,
      action: 'display_role_updated',
      memberId: memberUserId,
      displayRole: normalizedDisplayRole,
    });

    return updated;
  }

  private normalizeMemberDisplayRole(displayRole: string): string {
    const normalized = String(displayRole || '').replace(/\\s+/g, ' ').trim();

    if (!normalized) {
      throw new BadRequestException('Display role is required');
    }

    if (normalized.length > 40) {
      throw new BadRequestException('Display role must be 40 characters or fewer');
    }

    return normalized;
  }

  private getProjectNotificationName(project: ProjectDocument): string {
    return String((project as any)?.name || (project as any)?.title || 'Project').trim() || 'Project';
  }

  private getProjectNotificationId(project: ProjectDocument): string {
    return String((project as any)?._id || (project as any)?.id || '').trim();
  }

  private getProjectNotificationUserIds(
    project: ProjectDocument,
    extraUserIds: string[] = [],
  ): string[] {
    const ids = new Set<string>();

    const ownerId = this.getProjectOwnerId(project);
    if (ownerId) ids.add(ownerId);

    const members = Array.isArray(project?.members) ? project.members : [];
    members.forEach((member: any) => {
      const memberId = this.getProjectMemberUserId(member);
      if (memberId) ids.add(memberId);
    });

    extraUserIds.forEach((id) => {
      const normalized = this.normalizeAccessUserId(id);
      if (normalized) ids.add(normalized);
    });

    return Array.from(ids).filter(Boolean);
  }

  private async notifyProjectMembers(args: {
    project: ProjectDocument;
    recipientUserIds?: string[];
    triggeredBy: string;
    type: NotificationType;
    title: string;
    body: string;
    icon: string;
    groupKey: string;
    extra?: Record<string, any>;
  }): Promise<void> {
    if (!this.notifications?.createBulk) return;

    const projectId = this.getProjectNotificationId(args.project);
    const projectName = this.getProjectNotificationName(args.project);
    const recipientUserIds = args.recipientUserIds?.length
      ? args.recipientUserIds
      : this.getProjectNotificationUserIds(args.project);

    if (!projectId || recipientUserIds.length === 0) return;

    await this.notifications.createBulk(
      recipientUserIds.map((recipientId) => ({
        userId: recipientId,
        type: args.type,
        title: args.title,
        body: args.body,
        icon: args.icon,
        priority: NotificationPriority.NORMAL,
        triggeredBy: args.triggeredBy,
        data: {
          projectId,
          projectName,
          extra: args.extra || {},
        },
        actions: [{ label: 'View Project', url: `/projects/${projectId}` }],
        groupKey: `${args.groupKey}-${recipientId}`,
      })),
    );
  }

  private async notifyProjectMembersAboutDisplayRoleChange(
    project: ProjectDocument,
    changedBy: string,
    memberUserId: string,
    displayRole: string,
  ): Promise<void> {
    const projectName = this.getProjectNotificationName(project);
    const projectId = this.getProjectNotificationId(project);

    await this.notifyProjectMembers({
      project,
      triggeredBy: changedBy,
      type: NotificationType.PROJECT_UPDATE,
      title: 'Project Role Updated',
      body: `${projectName}: a member role label was changed to ${displayRole}.`,
      icon: '🏷️',
      groupKey: `project-display-role-${projectId}-${memberUserId}-${displayRole}`,
      extra: {
        action: 'display_role_updated',
        memberId: memberUserId,
        displayRole,
      },
    });
  }

  private async notifyProjectMembersAboutPermissionRoleChange(
    project: ProjectDocument,
    changedBy: string,
    memberUserId: string,
    role: MemberRole,
  ): Promise<void> {
    const projectName = this.getProjectNotificationName(project);
    const projectId = this.getProjectNotificationId(project);

    await this.notifyProjectMembers({
      project,
      triggeredBy: changedBy,
      type: NotificationType.PROJECT_UPDATE,
      title: 'Project Permission Updated',
      body: `${projectName}: a member permission role was changed to ${role}.`,
      icon: '🛡️',
      groupKey: `project-permission-role-${projectId}-${memberUserId}-${role}`,
      extra: {
        action: 'permission_role_updated',
        memberId: memberUserId,
        role,
      },
    });
  }

  private async notifyProjectMembersAboutMemberRemoval(
    project: ProjectDocument,
    removedBy: string,
    removedMemberUserId: string,
    removedDisplayRole: string,
  ): Promise<void> {
    const projectName = this.getProjectNotificationName(project);
    const projectId = this.getProjectNotificationId(project);
    const recipientUserIds = this.getProjectNotificationUserIds(project, [removedMemberUserId]);

    await this.notifyProjectMembers({
      project,
      recipientUserIds,
      triggeredBy: removedBy,
      type: NotificationType.PROJECT_MEMBER_LEFT,
      title: 'Project Member Removed',
      body: `${projectName}: a member was removed from the project.`,
      icon: '👋',
      groupKey: `project-member-removed-${projectId}-${removedMemberUserId}`,
      extra: {
        action: 'member_removed',
        memberId: removedMemberUserId,
        displayRole: removedDisplayRole,
      },
    });
  }"""

    edited = replace_once(
        edited,
        old_block,
        new_block,
        "removeMember/updateMemberRole/member-display-role service block",
    )

    required_markers = [
        "NotificationPriority, NotificationType",
        "updateMemberDisplayRole(",
        "normalizeMemberDisplayRole(",
        "notifyProjectMembersAboutDisplayRoleChange(",
        "notifyProjectMembersAboutMemberRemoval(",
        "project.member.display_role_updated",
        "project.members.changed",
        "Display role must be 40 characters or fewer",
    ]

    for marker in required_markers:
        if marker not in edited:
            fail(f"Prewrite verification failed. Missing marker: {marker}")

    if not BACKUP.exists():
        shutil.copy2(TARGET, BACKUP)
        print(f"[add_project_member_management_service_methods] backup created: {BACKUP}")
    else:
        print(f"[add_project_member_management_service_methods] backup already exists, preserved: {BACKUP}")

    TARGET.write_text(edited, encoding="utf-8")

    updated = TARGET.read_text(encoding="utf-8")
    for marker in required_markers:
        if marker not in updated:
            fail(f"Post-edit verification failed. Missing marker after write: {marker}")

    print("\n[add_project_member_management_service_methods] complete")
    print("\nNext checks:")
    print("  npm run build")
    print("  rg -n \"updateMemberDisplayRole|normalizeMemberDisplayRole|notifyProjectMembersAboutDisplayRoleChange|notifyProjectMembersAboutMemberRemoval|project.member.display_role_updated|project.members.changed|NotificationPriority|NotificationType\" src/projects/projects.service.ts -C 6")
    print("  git diff -- src/projects/projects.service.ts")


if __name__ == "__main__":
    main()
