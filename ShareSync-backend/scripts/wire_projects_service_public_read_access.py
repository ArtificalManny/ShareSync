#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-backend")
TARGET = ROOT / "src/projects/projects.service.ts"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[wire_projects_service_public_read_access] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def main():
    print("[wire_projects_service_public_read_access] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")
    original = source

    required_markers = [
        "async findByIdWithAccess(projectId: string, userId: string): Promise<ProjectDocument> {",
        "private hasAccess(project: ProjectDocument, userId: string): boolean {",
        "private canEdit(project: ProjectDocument, userId: string): boolean {",
        "private canManageMembers(project: ProjectDocument, userId: string): boolean {",
        "ProjectVisibility.PUBLIC",
        "ProjectVisibility.LISTED",
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}")

    old_has_access = """  private hasAccess(project: ProjectDocument, userId: string): boolean {
    const ownerId = (project.ownerId || (project as any).owner)?.toString();
    if (ownerId === userId) return true;
    return project.members.some((m) => m.userId.toString() === userId);
  }

  private canEdit(project: ProjectDocument, userId: string): boolean {"""

    new_has_access = """  private normalizeAccessUserId(value: any): string {
    return String(value || '').trim();
  }

  private getProjectOwnerId(project: ProjectDocument): string {
    return this.normalizeAccessUserId(
      project?.ownerId ||
        (project as any)?.owner ||
        (project as any)?.createdBy ||
        (project as any)?.createdById,
    );
  }

  private getProjectMemberUserId(member: any): string {
    return this.normalizeAccessUserId(
      member?.userId ||
        member?.user ||
        member?._id ||
        member?.id ||
        member,
    );
  }

  private isProjectArchivedForAccess(project: ProjectDocument): boolean {
    const status = String(project?.status || '').trim().toLowerCase();

    return (
      (project as any)?.isArchived === true ||
      status === String(ProjectStatus.ARCHIVED).toLowerCase() ||
      status === 'archived' ||
      status === 'deleted'
    );
  }

  private isPublicProjectForAccess(project: ProjectDocument): boolean {
    if (!project || this.isProjectArchivedForAccess(project)) {
      return false;
    }

    const visibility = String(project?.visibility || '').trim().toLowerCase();
    const settings = (project as any)?.settings || {};

    return (
      visibility === String(ProjectVisibility.PUBLIC).toLowerCase() ||
      visibility === String(ProjectVisibility.LISTED).toLowerCase() ||
      visibility === 'public' ||
      visibility === 'listed' ||
      (project as any)?.isPublic === true ||
      (project as any)?.public === true ||
      settings?.isPublic === true
    );
  }

  private isProjectOwner(project: ProjectDocument, userId: string): boolean {
    const normalizedUserId = this.normalizeAccessUserId(userId);
    if (!normalizedUserId) return false;

    return this.getProjectOwnerId(project) === normalizedUserId;
  }

  private isProjectMember(project: ProjectDocument, userId: string): boolean {
    const normalizedUserId = this.normalizeAccessUserId(userId);
    if (!normalizedUserId) return false;

    const members = Array.isArray(project?.members) ? project.members : [];

    return members.some((member: any) => (
      this.getProjectMemberUserId(member) === normalizedUserId
    ));
  }

  private hasAccess(project: ProjectDocument, userId: string): boolean {
    // Owner/member access remains full project access.
    if (this.isProjectOwner(project, userId)) return true;
    if (this.isProjectMember(project, userId)) return true;

    // Public projects are readable by non-members so ProjectHome can render
    // spectator/read-only mode. Mutating methods still call canEdit(),
    // canManageMembers(), or owner checks after this, so this does not grant
    // write permissions.
    return this.isPublicProjectForAccess(project);
  }

  private canEdit(project: ProjectDocument, userId: string): boolean {"""

    if "private isPublicProjectForAccess(project: ProjectDocument): boolean" not in source:
        if old_has_access not in source:
            fail("Could not find exact hasAccess block to replace.")
        source = source.replace(old_has_access, new_has_access, 1)
        print("[wire_projects_service_public_read_access] replaced hasAccess with public-read-aware helpers")
    else:
        print("[wire_projects_service_public_read_access] public-read-aware helpers already present")

    # Patch canEdit and canManageMembers to use the safer helper functions.
    old_can_edit = """  private canEdit(project: ProjectDocument, userId: string): boolean {
    const ownerId = (project.ownerId || (project as any).owner)?.toString();
    if (ownerId === userId) return true;
    const member = project.members.find((m) => m.userId.toString() === userId);
    return member?.role === MemberRole.ADMIN;
  }"""

    new_can_edit = """  private canEdit(project: ProjectDocument, userId: string): boolean {
    if (this.isProjectOwner(project, userId)) return true;

    const normalizedUserId = this.normalizeAccessUserId(userId);
    const members = Array.isArray(project?.members) ? project.members : [];
    const member = members.find((m: any) => (
      this.getProjectMemberUserId(m) === normalizedUserId
    ));

    return member?.role === MemberRole.ADMIN;
  }"""

    if "const normalizedUserId = this.normalizeAccessUserId(userId);" not in source.split("private canEdit", 1)[1].split("private canManageMembers", 1)[0]:
        if old_can_edit not in source:
            fail("Could not find exact canEdit block to replace.")
        source = source.replace(old_can_edit, new_can_edit, 1)
        print("[wire_projects_service_public_read_access] hardened canEdit member lookup")
    else:
        print("[wire_projects_service_public_read_access] canEdit already hardened")

    old_can_manage = """  private canManageMembers(project: ProjectDocument, userId: string): boolean {
    const ownerId = (project.ownerId || (project as any).owner)?.toString();
    if (ownerId === userId) return true;
    const member = project.members.find((m) => m.userId.toString() === userId);
    return member?.role === MemberRole.ADMIN;
  }"""

    new_can_manage = """  private canManageMembers(project: ProjectDocument, userId: string): boolean {
    if (this.isProjectOwner(project, userId)) return true;

    const normalizedUserId = this.normalizeAccessUserId(userId);
    const members = Array.isArray(project?.members) ? project.members : [];
    const member = members.find((m: any) => (
      this.getProjectMemberUserId(m) === normalizedUserId
    ));

    return member?.role === MemberRole.ADMIN;
  }"""

    if "private canManageMembers(project: ProjectDocument, userId: string): boolean {\n    if (this.isProjectOwner(project, userId)) return true;" not in source:
        if old_can_manage not in source:
            fail("Could not find exact canManageMembers block to replace.")
        source = source.replace(old_can_manage, new_can_manage, 1)
        print("[wire_projects_service_public_read_access] hardened canManageMembers member lookup")
    else:
        print("[wire_projects_service_public_read_access] canManageMembers already hardened")

    required_after = [
        "private normalizeAccessUserId(value: any): string",
        "private getProjectOwnerId(project: ProjectDocument): string",
        "private getProjectMemberUserId(member: any): string",
        "private isProjectArchivedForAccess(project: ProjectDocument): boolean",
        "private isPublicProjectForAccess(project: ProjectDocument): boolean",
        "private isProjectOwner(project: ProjectDocument, userId: string): boolean",
        "private isProjectMember(project: ProjectDocument, userId: string): boolean",
        "return this.isPublicProjectForAccess(project);",
        "if (this.isProjectOwner(project, userId)) return true;",
        "this.getProjectMemberUserId(m) === normalizedUserId",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    if source == original:
        print("[wire_projects_service_public_read_access] no changes needed")
        return

    backup = TARGET.with_name(f"{TARGET.name}.bak-public-read-access-{STAMP}")
    backup.write_text(original, encoding="utf-8")
    print(f"[wire_projects_service_public_read_access] backup created: {backup}")

    TARGET.write_text(source, encoding="utf-8")
    print(f"[wire_projects_service_public_read_access] patched: {TARGET}")

    print("")
    print("[wire_projects_service_public_read_access] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"findByIdWithAccess|normalizeAccessUserId|getProjectOwnerId|getProjectMemberUserId|isProjectArchivedForAccess|isPublicProjectForAccess|isProjectOwner|isProjectMember|hasAccess|canEdit|canManageMembers\" src/projects/projects.service.ts -C 8")
    print("  git diff -- src/projects/projects.service.ts")


if __name__ == "__main__":
    main()
