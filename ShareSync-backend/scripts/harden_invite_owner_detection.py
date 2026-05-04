from pathlib import Path

path = Path("src/projects/invites.service.ts")

if not path.exists():
    raise SystemExit(f"Missing file: {path}")

text = path.read_text()

old = """  private canManageInvites(project: any, actingUserId: string): boolean {
    const acting = String(actingUserId || '');

    if (!acting) return false;

    // Project owner always manages invites.
    if (this.getId(project.ownerId || project.owner) === acting) {
      return true;
    }

    const role = this.getProjectMemberRole(project, acting);

    // Treat admin/moderator/manager as invite-capable.
    return ['owner', 'admin', 'moderator', 'manager'].includes(role);
  }"""

new = """  private canManageInvites(project: any, actingUserId: string): boolean {
    const acting = String(actingUserId || '');

    if (!acting) return false;

    // Support both current and legacy ownership fields.
    const ownerLikeRefs = [
      project.ownerId,
      project.owner,
      project.createdBy,
      project.createdById,
      project.creatorId,
      project.userId,
    ];

    const isOwnerLike = ownerLikeRefs.some((ref) => this.getId(ref) === acting);

    if (isOwnerLike) {
      return true;
    }

    const role = this.getProjectMemberRole(project, acting);

    // Treat admin/moderator/manager as invite-capable.
    return ['owner', 'admin', 'moderator', 'manager'].includes(role);
  }"""

if old not in text:
    raise SystemExit("Could not find canManageInvites block.")

text = text.replace(old, new, 1)

path.write_text(text)
print("Patched invite owner detection to support legacy owner fields.")
