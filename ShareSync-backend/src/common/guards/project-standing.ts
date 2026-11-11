import { Types } from 'mongoose';

// openshare-project-standing-v1 (R51)
//
// Where a signed-in user stands in a project, for authorization:
//
// - 'writer':    the owner, or a member whose role is owner, admin or member. A
//                member without a role counts as a member, the schema default.
// - 'reader':    a member with any other role (viewer, guest). The app tells
//                people viewers are read-only.
// - 'spectator': not a member, but the project is public or listed and isn't
//                archived, so it may be read.
// - 'none':      everyone else.
//
// These are the rules of the announcements guard (R50). Its tests and the R51
// tests check that both give the same answer for the same project and user.

export type ProjectStanding = 'writer' | 'reader' | 'spectator' | 'none';

export const OBJECT_ID = /^[0-9a-f]{24}$/i;

// The project fields projectStanding() reads. Load at least these.
export const PROJECT_STANDING_FIELDS = [
  'ownerId',
  'owner',
  'createdBy',
  'createdById',
  'members',
  'visibility',
  'isPublic',
  'public',
  'settings.isPublic',
  'status',
  'isArchived',
].join(' ');

const WRITER_ROLES = new Set(['owner', 'admin', 'member']);

// A 24-character hex ObjectId as lowercase text, or '' for anything else.
export function idText(value: unknown): string {
  if (value instanceof Types.ObjectId) return value.toHexString().toLowerCase();
  if (typeof value === 'string' && OBJECT_ID.test(value.trim())) {
    return value.trim().toLowerCase();
  }
  return '';
}

function firstId(candidates: unknown[]): string {
  for (const candidate of candidates) {
    const id = idText(candidate);
    if (id) return id;
  }
  return '';
}

// The signed-in user's ID from the JWT payload, in the same order as R50.
export function actorIdOf(user: any): string {
  return firstId([user?.userId, user?._id, user?.id, user?.sub]);
}

function ownerIdOf(project: any): string {
  return firstId([
    project?.ownerId,
    project?.owner,
    project?.createdBy,
    project?.createdById,
  ]);
}

function memberIdOf(member: any): string {
  if (member instanceof Types.ObjectId || typeof member === 'string') {
    return idText(member);
  }
  return firstId([
    member?.userId,
    member?.user,
    member?.memberId,
    member?._id,
    member?.id,
  ]);
}

function isPublicReadable(project: any): boolean {
  const status = String(project?.status ?? '').trim().toLowerCase();
  if (project?.isArchived === true || status === 'archived' || status === 'deleted') {
    return false;
  }

  const visibility = String(project?.visibility ?? '').trim().toLowerCase();
  return (
    visibility === 'public' ||
    visibility === 'listed' ||
    project?.isPublic === true ||
    project?.public === true ||
    project?.settings?.isPublic === true
  );
}

export function projectStanding(project: any, userId: string): ProjectStanding {
  if (!project || typeof userId !== 'string' || !OBJECT_ID.test(userId)) return 'none';
  const actor = userId.toLowerCase();

  if (ownerIdOf(project) === actor) return 'writer';

  const members = Array.isArray(project.members) ? project.members : [];
  for (const member of members) {
    if (memberIdOf(member) !== actor) continue;
    const role = String(member?.role ?? '').trim().toLowerCase() || 'member';
    return WRITER_ROLES.has(role) ? 'writer' : 'reader';
  }

  return isPublicReadable(project) ? 'spectator' : 'none';
}

// openshare-project-standing-v2 (R52)
// Who may manage a project's connections: the owner, or a member whose role
// is owner or admin. Project settings (projectsService.canEdit) also go to
// the owner and admins.
const MANAGER_ROLES = new Set(['owner', 'admin']);

export function isProjectManager(project: any, userId: string): boolean {
  if (!project || typeof userId !== 'string' || !OBJECT_ID.test(userId)) return false;
  const actor = userId.toLowerCase();

  if (ownerIdOf(project) === actor) return true;

  const members = Array.isArray(project.members) ? project.members : [];
  for (const member of members) {
    if (memberIdOf(member) !== actor) continue;
    const role = String(member?.role ?? '').trim().toLowerCase() || 'member';
    return MANAGER_ROLES.has(role);
  }

  return false;
}
