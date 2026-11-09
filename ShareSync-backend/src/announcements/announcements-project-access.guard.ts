import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project } from '../projects/schemas/project.schema';
import { Announcement } from './schemas/announcements.schema';

// openshare-announcements-project-access-v1
//
// Authorization for every route of the Announcements controller
// (`projects/:projectId/announcements`). Runs after JwtAuthGuard.
//
// - Reading (GET/HEAD): the project owner, any current member, or, for a public
//   or listed project that isn't archived, a signed-in spectator. This is the
//   same read contract as the Vault and the project page's spectator mode.
// - Marking an announcement read: the owner or any current member. Spectators
//   are not members, so they leave no read receipts.
// - Everything else (post, edit, delete, pin, like, comment, vote): the owner,
//   or a member whose role is owner, admin or member. A member without a role
//   counts as a member, the schema default. Viewers and guests only read.
// - Routes with an announcement ID: the announcement must belong to the
//   project in the address. Older service methods change announcements by ID
//   alone, so authorizing the project is not enough on its own.
//
// The project comes only from the route, never from the body or query. IDs that
// aren't ObjectIds are refused before any database query, and a database error
// refuses the request: an outage never becomes access.

const OBJECT_ID = /^[0-9a-f]{24}$/i;
const WRITER_ROLES = new Set(['owner', 'admin', 'member']);
const WRITE_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);
const PROJECT_FIELDS = [
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

type Access = 'read' | 'read-receipt' | 'write';
type Standing = 'writer' | 'reader' | 'spectator' | 'none';

function idText(value: unknown): string {
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

function actorIdOf(user: any): string {
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

export function announcementStanding(project: any, userId: string): Standing {
  if (!project || !OBJECT_ID.test(userId)) return 'none';
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

@Injectable()
export class AnnouncementsProjectAccessGuard implements CanActivate {
  constructor(
    @InjectModel(Project.name) private readonly projects: Model<Project>,
    @InjectModel(Announcement.name) private readonly announcements: Model<Announcement>,
  ) {}

  private accessFor(method: string, handlerName: string): Access {
    if (method === 'GET' || method === 'HEAD') return 'read';
    // The handler is chosen by the server's routing, not by the client.
    if (method === 'PATCH' && handlerName === 'markAsRead') return 'read-receipt';
    if (WRITE_METHODS.has(method)) return 'write';
    throw new ForbiddenException('Unsupported announcement operation');
  }

  private async loadProject(projectId: string): Promise<any> {
    try {
      return await this.projects
        .findById(new Types.ObjectId(projectId))
        .select(PROJECT_FIELDS)
        .lean()
        .exec();
    } catch {
      throw new ServiceUnavailableException('Announcement authorization unavailable');
    }
  }

  private async assertAnnouncementInProject(params: any, projectId: string): Promise<void> {
    if (params?.id === undefined) return;

    const announcementId = params.id;
    if (typeof announcementId !== 'string' || !OBJECT_ID.test(announcementId)) {
      throw new ForbiddenException('Not authorized for this announcement');
    }

    let found: unknown;
    try {
      found = await this.announcements
        .exists({
          _id: new Types.ObjectId(announcementId),
          projectId: new Types.ObjectId(projectId),
        })
        .exec();
    } catch {
      throw new ServiceUnavailableException('Announcement authorization unavailable');
    }

    if (!found) {
      throw new ForbiddenException('Not authorized for this announcement');
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const projectId = request?.params?.projectId;
    const userId = actorIdOf(request?.user);

    if (typeof projectId !== 'string' || !OBJECT_ID.test(projectId) || !userId) {
      throw new ForbiddenException('Not authorized for this project');
    }

    const access = this.accessFor(
      String(request?.method ?? '').toUpperCase(),
      String(context.getHandler()?.name ?? ''),
    );

    const project = await this.loadProject(projectId);
    const standing = announcementStanding(project, userId);

    const allowed =
      access === 'write'
        ? standing === 'writer'
        : access === 'read-receipt'
          ? standing === 'writer' || standing === 'reader'
          : standing !== 'none';

    if (!allowed) {
      throw new ForbiddenException('Not authorized for this project');
    }

    await this.assertAnnouncementInProject(request?.params, projectId);
    return true;
  }
}
