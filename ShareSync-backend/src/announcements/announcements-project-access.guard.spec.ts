import 'reflect-metadata';
import { ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Types } from 'mongoose';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnnouncementsController } from './announcements.controller';
import {
  AnnouncementsProjectAccessGuard,
  announcementStanding,
} from './announcements-project-access.guard';

// openshare-announcements-project-access-v1 (R50)

const projectId = '507f1f77bcf86cd799439011';
const actorId = '507f191e810c19729de860ea';
const otherId = '507f1f77bcf86cd799439012';
const announcementId = '64b7f0c2a1b2c3d4e5f60718';
const oid = (id: string) => new Types.ObjectId(id);

type Options = {
  method?: string;
  handlerName?: string;
  project?: any;
  role?: string | null;
  owner?: boolean;
  userId?: any;
  projectId?: any;
  announcementId?: any;
  announcementExists?: boolean;
  rejectProject?: boolean;
  rejectAnnouncement?: boolean;
};

function harness(options: Options = {}) {
  const project =
    options.project !== undefined
      ? options.project
      : {
          ownerId: oid(options.owner ? actorId : otherId),
          members:
            options.role === undefined
              ? []
              : [
                  options.role === null
                    ? { userId: oid(actorId) }
                    : { userId: oid(actorId), role: options.role },
                ],
        };

  const projectExec = jest.fn().mockImplementation(async () => {
    if (options.rejectProject) throw new Error('hidden database details');
    return project;
  });
  const lean = jest.fn().mockReturnValue({ exec: projectExec });
  const select = jest.fn().mockReturnValue({ lean });
  const findById = jest.fn().mockReturnValue({ select });

  const announcementExec = jest.fn().mockImplementation(async () => {
    if (options.rejectAnnouncement) throw new Error('hidden database details');
    return options.announcementExists === false ? null : { _id: oid(announcementId) };
  });
  const exists = jest.fn().mockReturnValue({ exec: announcementExec });

  const guard = new AnnouncementsProjectAccessGuard(
    { findById } as any,
    { exists } as any,
  );

  const params: any = {
    projectId: options.projectId === undefined ? projectId : options.projectId,
  };
  if (options.announcementId !== undefined) params.id = options.announcementId;

  const request = {
    method: options.method ?? 'GET',
    params,
    user: { userId: options.userId === undefined ? actorId : options.userId },
  };
  const context: any = {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({ name: options.handlerName ?? 'getAnnouncements' }),
  };

  return { guard, context, findById, select, exists };
}

const WRITES: Array<[string, string]> = [
  ['POST', 'createAnnouncement'],
  ['PATCH', 'updateAnnouncement'],
  ['PATCH', 'togglePin'],
  ['DELETE', 'deleteAnnouncement'],
  ['POST', 'toggleLike'],
  ['POST', 'votePoll'],
  ['POST', 'addComment'],
  ['DELETE', 'deleteComment'],
];

describe('R50 announcements project access', () => {
  it('runs after JWT authentication on the whole controller', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, AnnouncementsController);
    expect(guards).toEqual([JwtAuthGuard, AnnouncementsProjectAccessGuard]);
  });

  it('has a real markAsRead handler for the read-receipt exception', () => {
    expect(typeof (AnnouncementsController.prototype as any).markAsRead).toBe('function');
  });

  it('lets the owner read and write', async () => {
    for (const [method, handlerName] of [['GET', 'getAnnouncements'], ...WRITES]) {
      const h = harness({ owner: true, method, handlerName });
      await expect(h.guard.canActivate(h.context)).resolves.toBe(true);
    }
  });

  it.each(['owner', 'admin', 'member', 'ADMIN', ' Member '])(
    'lets a member with role %p read and write',
    async (role) => {
      for (const [method, handlerName] of [['GET', 'getAnnouncements'], ...WRITES]) {
        const h = harness({ role, method, handlerName });
        await expect(h.guard.canActivate(h.context)).resolves.toBe(true);
      }
    },
  );

  it('treats a member without a role as a member (the schema default)', async () => {
    const h = harness({ role: null, method: 'POST', handlerName: 'createAnnouncement' });
    await expect(h.guard.canActivate(h.context)).resolves.toBe(true);
  });

  it.each(['viewer', 'guest'])('lets a %s read and mark read, but not write', async (role) => {
    const read = harness({ role });
    await expect(read.guard.canActivate(read.context)).resolves.toBe(true);

    const receipt = harness({
      role,
      method: 'PATCH',
      handlerName: 'markAsRead',
      announcementId,
    });
    await expect(receipt.guard.canActivate(receipt.context)).resolves.toBe(true);

    for (const [method, handlerName] of WRITES) {
      const h = harness({ role, method, handlerName });
      await expect(h.guard.canActivate(h.context)).rejects.toBeInstanceOf(ForbiddenException);
    }
  });

  it('refuses an unknown role for writes', async () => {
    const h = harness({ role: 'superuser', method: 'POST', handlerName: 'createAnnouncement' });
    await expect(h.guard.canActivate(h.context)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('refuses an outsider on a private project for every route', async () => {
    for (const [method, handlerName] of [
      ['GET', 'getAnnouncements'],
      ['GET', 'getPinnedAnnouncements'],
      ['PATCH', 'markAsRead'],
      ...WRITES,
    ]) {
      const h = harness({ method, handlerName, announcementId });
      await expect(h.guard.canActivate(h.context)).rejects.toBeInstanceOf(ForbiddenException);
      expect(h.exists).not.toHaveBeenCalled();
    }
  });

  it.each([
    [{ visibility: 'public' }],
    [{ visibility: 'Listed' }],
    [{ isPublic: true }],
    [{ public: true }],
    [{ settings: { isPublic: true } }],
  ])('lets a spectator read a public project (%p) but nothing else', async (flags) => {
    const project = { ownerId: oid(otherId), members: [], ...flags };

    const read = harness({ project });
    await expect(read.guard.canActivate(read.context)).resolves.toBe(true);

    const head = harness({ project, method: 'HEAD' });
    await expect(head.guard.canActivate(head.context)).resolves.toBe(true);

    const receipt = harness({ project, method: 'PATCH', handlerName: 'markAsRead', announcementId });
    await expect(receipt.guard.canActivate(receipt.context)).rejects.toBeInstanceOf(ForbiddenException);

    for (const [method, handlerName] of WRITES) {
      const h = harness({ project, method, handlerName });
      await expect(h.guard.canActivate(h.context)).rejects.toBeInstanceOf(ForbiddenException);
    }
  });

  it.each([
    [{ visibility: 'public', status: 'archived' }],
    [{ visibility: 'public', status: 'Deleted' }],
    [{ visibility: 'listed', isArchived: true }],
    [{ visibility: 'private' }],
    [{ visibility: 'team' }],
    [{ isPublic: 'true' }],
  ])('refuses a spectator when the project is not publicly readable (%p)', async (flags) => {
    const h = harness({ project: { ownerId: oid(otherId), members: [], ...flags } });
    await expect(h.guard.canActivate(h.context)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('still lets members of an archived project read and write', async () => {
    const project = {
      ownerId: oid(otherId),
      status: 'archived',
      members: [{ userId: oid(actorId), role: 'member' }],
    };
    const h = harness({ project, method: 'POST', handlerName: 'createAnnouncement' });
    await expect(h.guard.canActivate(h.context)).resolves.toBe(true);
  });

  it('refuses an unknown project', async () => {
    const h = harness({ project: null });
    await expect(h.guard.canActivate(h.context)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('refuses missing or forged IDs before any database query', async () => {
    for (const change of [
      { userId: '' },
      { userId: null },
      { userId: { role: 'owner' } },
      { userId: 'not-an-id' },
      { projectId: projectId.slice(0, 4) },
      { projectId: { $ne: null } },
      { projectId: '' },
    ] as Options[]) {
      const h = harness({ owner: true, ...change });
      await expect(h.guard.canActivate(h.context)).rejects.toBeInstanceOf(ForbiddenException);
      expect(h.findById).not.toHaveBeenCalled();
    }
  });

  it('refuses instead of allowing when the project lookup fails', async () => {
    const h = harness({ owner: true, rejectProject: true });
    await expect(h.guard.canActivate(h.context)).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('requires an announcement ID in the address to belong to that project', async () => {
    const h = harness({
      owner: true,
      method: 'DELETE',
      handlerName: 'deleteAnnouncement',
      announcementId,
      announcementExists: false,
    });
    await expect(h.guard.canActivate(h.context)).rejects.toBeInstanceOf(ForbiddenException);
    expect(h.exists).toHaveBeenCalledWith({
      _id: oid(announcementId),
      projectId: oid(projectId),
    });
  });

  it('allows an announcement ID that belongs to the project', async () => {
    const h = harness({ owner: true, method: 'PATCH', handlerName: 'togglePin', announcementId });
    await expect(h.guard.canActivate(h.context)).resolves.toBe(true);
    expect(h.exists).toHaveBeenCalledTimes(1);
  });

  it('checks the announcement on read receipts and spectator reads too', async () => {
    const receipt = harness({
      role: 'viewer',
      method: 'PATCH',
      handlerName: 'markAsRead',
      announcementId,
      announcementExists: false,
    });
    await expect(receipt.guard.canActivate(receipt.context)).rejects.toBeInstanceOf(ForbiddenException);

    const spectator = harness({
      project: { ownerId: oid(otherId), members: [], visibility: 'public' },
      handlerName: 'getReadStatus',
      announcementId,
      announcementExists: false,
    });
    await expect(spectator.guard.canActivate(spectator.context)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('refuses a malformed announcement ID without querying announcements', async () => {
    for (const bad of ['bad-id', { $gt: '' }, '']) {
      const h = harness({ owner: true, method: 'PATCH', handlerName: 'togglePin', announcementId: bad });
      await expect(h.guard.canActivate(h.context)).rejects.toBeInstanceOf(ForbiddenException);
      expect(h.exists).not.toHaveBeenCalled();
    }
  });

  it('refuses instead of allowing when the announcement lookup fails', async () => {
    const h = harness({
      owner: true,
      method: 'DELETE',
      handlerName: 'deleteAnnouncement',
      announcementId,
      rejectAnnouncement: true,
    });
    await expect(h.guard.canActivate(h.context)).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('refuses unsupported HTTP methods', async () => {
    for (const method of ['TRACE', 'OPTIONS', 'CONNECT', '']) {
      const h = harness({ owner: true, method });
      await expect(h.guard.canActivate(h.context)).rejects.toBeInstanceOf(ForbiddenException);
    }
  });

  it('only treats the markAsRead handler as a read receipt', async () => {
    const h = harness({ role: 'viewer', method: 'PATCH', handlerName: 'togglePin', announcementId });
    await expect(h.guard.canActivate(h.context)).rejects.toBeInstanceOf(ForbiddenException);

    const post = harness({ role: 'viewer', method: 'POST', handlerName: 'markAsRead', announcementId });
    await expect(post.guard.canActivate(post.context)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('reads only the fields it needs from the project', async () => {
    const h = harness({ owner: true });
    await h.guard.canActivate(h.context);
    const fields = String(h.select.mock.calls[0][0]).split(' ');
    expect(fields).toEqual(expect.arrayContaining(['ownerId', 'members', 'visibility', 'status']));
    expect(fields).not.toContain('invites');
  });
});

describe('R50 announcement standing', () => {
  it('uses ownerId before the legacy owner alias', () => {
    expect(announcementStanding({ ownerId: oid(otherId), owner: oid(actorId), members: [] }, actorId)).toBe('none');
    expect(announcementStanding({ owner: oid(actorId), members: [] }, actorId)).toBe('writer');
    expect(announcementStanding({ createdBy: actorId, members: [] }, actorId)).toBe('writer');
  });

  it('matches member IDs stored in any of the known shapes', () => {
    for (const member of [
      { userId: actorId, role: 'member' },
      { userId: actorId.toUpperCase(), role: 'member' },
      { user: oid(actorId), role: 'member' },
      { memberId: oid(actorId), role: 'member' },
      oid(actorId),
      actorId,
    ]) {
      expect(announcementStanding({ ownerId: oid(otherId), members: [member] }, actorId)).toBe('writer');
    }
  });

  it('trims stored string IDs, as the project service does', () => {
    const member = { userId: ` ${actorId} `, role: 'admin' };
    expect(announcementStanding({ ownerId: oid(otherId), members: [member] }, actorId)).toBe('writer');
  });

  it('never matches objects or forged values as IDs', () => {
    for (const member of [
      { userId: { toString: () => actorId }, role: 'member' },
      { userId: [actorId], role: 'member' },
      { role: 'owner' },
      null,
    ]) {
      expect(announcementStanding({ ownerId: oid(otherId), members: [member] }, actorId)).toBe('none');
    }
    expect(announcementStanding({ ownerId: { toString: () => actorId }, members: [] }, actorId)).toBe('none');
  });

  it('gives nothing for a missing project or a malformed user ID', () => {
    expect(announcementStanding(null, actorId)).toBe('none');
    expect(announcementStanding({ ownerId: oid(actorId) }, 'nope')).toBe('none');
  });
});

describe('R50 trusted IDs on create', () => {
  it('ignores projectId and authorId sent in the body', async () => {
    const create = jest.fn().mockResolvedValue({ ok: true });
    const controller = new AnnouncementsController({ create } as any);
    const body: any = {
      title: 'Title',
      message: 'Message',
      projectId: otherId,
      authorId: otherId,
    };

    await controller.createAnnouncement(projectId, { user: { userId: actorId } }, body);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ projectId, authorId: actorId, title: 'Title' }),
    );
  });
});
