import 'reflect-metadata';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  RequestMethod,
  ServiceUnavailableException,
} from '@nestjs/common';
import { GUARDS_METADATA, METHOD_METADATA } from '@nestjs/common/constants';
import { Types } from 'mongoose';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PROJECT_ACCESS_KEY, ProjectAccessGuard } from '../common/guards/project-access.guard';
import { MovesProjectAccessGuard } from './moves-project-access.guard';
import { ProjectTasksController } from './project-tasks.controller';
import { TasksController } from './tasks.controller';

// openshare-moves-project-access-v1 (R51)

const projectId = '507f1f77bcf86cd799439011';
const actorId = '507f191e810c19729de860ea';
const otherId = '507f1f77bcf86cd799439012';
const taskId = '64b7f0c2a1b2c3d4e5f60718';
const oid = (id: string) => new Types.ObjectId(id);

const READS = ['getPriorityTasks', 'find', 'getBoard', 'getStack', 'findOne', 'getWatchSettings', 'getSubtasks'];
const FOLLOW = ['updateWatchSettings'];
const WRITES = [
  'create',
  'patch',
  'update',
  'move',
  'complete',
  'delete',
  'addComment',
  'deleteComment',
  'addAttachment',
  'addFileReference',
  'deleteAttachment',
  'logTime',
];

const VERBS: Record<number, string> = {
  [RequestMethod.GET]: 'GET',
  [RequestMethod.POST]: 'POST',
  [RequestMethod.PUT]: 'PUT',
  [RequestMethod.DELETE]: 'DELETE',
  [RequestMethod.PATCH]: 'PATCH',
  [RequestMethod.HEAD]: 'HEAD',
};

// Every route handler of the Moves controller with its HTTP method.
function controllerRoutes(): Array<[string, string]> {
  const proto = TasksController.prototype as any;
  return Object.getOwnPropertyNames(proto)
    .filter((name) => name !== 'constructor' && typeof proto[name] === 'function')
    .filter((name) => Reflect.getMetadata(METHOD_METADATA, proto[name]) !== undefined)
    .map((name) => [name, VERBS[Reflect.getMetadata(METHOD_METADATA, proto[name])] ?? 'OTHER']);
}
const ROUTES = controllerRoutes();
const methodOf = (handler: string) => (ROUTES.find(([name]) => name === handler) || [])[1] as string;
const hasTaskId = (handler: string) => handler !== 'create';

type Options = {
  handler?: string;
  method?: string;
  project?: any;
  role?: string | null;
  owner?: boolean;
  visibility?: string;
  archived?: boolean;
  userId?: any;
  user?: any;
  taskId?: any;
  task?: any;
  body?: any;
  query?: any;
  rejectTask?: boolean;
  rejectProject?: boolean;
};

function harness(options: Options = {}) {
  const handler = options.handler ?? 'patch';
  const project =
    options.project !== undefined
      ? options.project
      : {
          ownerId: oid(options.owner ? actorId : otherId),
          visibility: options.visibility ?? 'private',
          isArchived: options.archived === true,
          members:
            options.role === undefined
              ? []
              : [options.role === null ? { userId: oid(actorId) } : { userId: oid(actorId), role: options.role }],
        };

  const projectExec = jest.fn().mockImplementation(async () => {
    if (options.rejectProject) throw new Error('hidden database details');
    return project;
  });
  const projectSelect = jest.fn().mockReturnValue({ lean: () => ({ exec: projectExec }) });
  const projectFindById = jest.fn().mockReturnValue({ select: projectSelect });

  const taskExec = jest.fn().mockImplementation(async () => {
    if (options.rejectTask) throw new Error('hidden database details');
    return options.task !== undefined ? options.task : { _id: oid(taskId), projectId: oid(projectId) };
  });
  const taskSelect = jest.fn().mockReturnValue({ lean: () => ({ exec: taskExec }) });
  const taskFindById = jest.fn().mockReturnValue({ select: taskSelect });

  const guard = new MovesProjectAccessGuard({ findById: projectFindById } as any, { findById: taskFindById } as any);

  const params: any = {};
  if (options.taskId !== undefined) params.id = options.taskId;
  else if (hasTaskId(handler)) params.id = taskId;

  const request = {
    method: options.method ?? methodOf(handler),
    params,
    query: options.query ?? {},
    body: options.body !== undefined ? options.body : handler === 'create' ? { projectId, title: 'A Move' } : {},
    user: Object.prototype.hasOwnProperty.call(options, 'user')
      ? options.user
      : { userId: options.userId === undefined ? actorId : options.userId },
  };
  const context: any = {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({ name: handler }),
  };

  return { guard, context, projectFindById, projectSelect, taskFindById, taskSelect };
}

async function outcome(options: Options): Promise<string> {
  const h = harness(options);
  try {
    await h.guard.canActivate(h.context);
    return 'allowed';
  } catch (error: any) {
    return error?.constructor?.name ?? 'error';
  }
}

describe('R51 Moves project access', () => {
  it('runs after JWT authentication on the whole Moves controller', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, TasksController)).toEqual([JwtAuthGuard, MovesProjectAccessGuard]);
  });

  it('knows every route of the Moves controller, so a new one has to be classified here', () => {
    expect(ROUTES.map(([name]) => name).sort()).toEqual([...READS, ...FOLLOW, ...WRITES].sort());
  });

  it('treats exactly the GET routes as reads', () => {
    for (const [name, method] of ROUTES) {
      expect([name, method === 'GET']).toEqual([name, READS.includes(name)]);
    }
  });

  it('has a real updateWatchSettings handler behind the follow exception, on PATCH', () => {
    expect(typeof (TasksController.prototype as any).updateWatchSettings).toBe('function');
    expect(methodOf('updateWatchSettings')).toBe('PATCH');
  });

  it.each(READS)('leaves the read %s to the service without touching the database', async (handler) => {
    for (const userId of [actorId, 'not-an-id', undefined, null]) {
      const h = harness({ handler, userId, taskId: 'not-an-id', role: 'viewer' });
      await expect(h.guard.canActivate(h.context)).resolves.toBe(true);
      expect(h.projectFindById).not.toHaveBeenCalled();
      expect(h.taskFindById).not.toHaveBeenCalled();
    }
  });

  it('lets the owner change and follow Moves', async () => {
    for (const handler of [...WRITES, ...FOLLOW]) {
      expect([handler, await outcome({ handler, owner: true })]).toEqual([handler, 'allowed']);
    }
  });

  it.each(['owner', 'admin', 'member', 'ADMIN', ' Member ', null, ''])(
    'lets a member with role %p change and follow Moves',
    async (role) => {
      for (const handler of [...WRITES, ...FOLLOW]) {
        expect([handler, await outcome({ handler, role })]).toEqual([handler, 'allowed']);
      }
    },
  );

  it.each(['viewer', 'guest', 'VIEWER', 'something-else'])(
    'lets a %p follow Moves but not change them',
    async (role) => {
      for (const handler of WRITES) {
        expect([handler, await outcome({ handler, role })]).toEqual([handler, 'ForbiddenException']);
      }
      expect(await outcome({ handler: 'updateWatchSettings', role })).toBe('allowed');
    },
  );

  it.each(['public', 'listed', 'PUBLIC'])(
    'refuses a spectator of a %s project every change, including following',
    async (visibility) => {
      for (const handler of [...WRITES, ...FOLLOW]) {
        expect([handler, await outcome({ handler, visibility })]).toEqual([handler, 'ForbiddenException']);
      }
    },
  );

  it('refuses an outsider of a private project every change', async () => {
    for (const handler of [...WRITES, ...FOLLOW]) {
      expect([handler, await outcome({ handler })]).toEqual([handler, 'ForbiddenException']);
    }
  });

  it('refuses everyone but members when the project is archived', async () => {
    expect(await outcome({ handler: 'patch', visibility: 'public', archived: true })).toBe('ForbiddenException');
    expect(await outcome({ handler: 'patch', owner: true, archived: true })).toBe('allowed');
    expect(await outcome({ handler: 'patch', role: 'member', archived: true })).toBe('allowed');
  });

  it('refuses when the project is gone', async () => {
    expect(await outcome({ handler: 'patch', project: null })).toBe('ForbiddenException');
    expect(await outcome({ handler: 'create', project: null })).toBe('ForbiddenException');
  });

  it('decides by the project the Move belongs to', async () => {
    const h = harness({ handler: 'delete', owner: true });
    await h.guard.canActivate(h.context);
    expect(h.taskFindById).toHaveBeenCalledWith(oid(taskId));
    expect(h.taskSelect).toHaveBeenCalledWith('projectId');
    expect(h.projectFindById).toHaveBeenCalledWith(oid(projectId));
  });

  it('decides a new Move by the projectId in the body, the one the service saves', async () => {
    const h = harness({ handler: 'create', owner: true, query: { projectId: otherId } });
    await expect(h.guard.canActivate(h.context)).resolves.toBe(true);
    expect(h.projectFindById).toHaveBeenCalledWith(oid(projectId));
    expect(h.taskFindById).not.toHaveBeenCalled();
  });

  it.each([undefined, '', 'not-an-id', ` ${projectId}`, 12, [projectId], { $ne: null }])(
    'refuses a new Move whose body projectId is %p, before the database',
    async (value) => {
      const body = value === undefined ? { title: 'A Move' } : { title: 'A Move', projectId: value };
      const h = harness({ handler: 'create', owner: true, body });
      await expect(h.guard.canActivate(h.context)).rejects.toBeInstanceOf(BadRequestException);
      expect(h.projectFindById).not.toHaveBeenCalled();
    },
  );

  it('refuses a new Move without a body', async () => {
    const h = harness({ handler: 'create', owner: true, body: null });
    await expect(h.guard.canActivate(h.context)).rejects.toBeInstanceOf(BadRequestException);
  });

  it.each(['not-an-id', '', `${taskId}0`, 12, [taskId]])(
    'refuses a malformed Move ID %p before the database',
    async (value) => {
      const h = harness({ handler: 'patch', owner: true, taskId: value });
      await expect(h.guard.canActivate(h.context)).rejects.toBeInstanceOf(BadRequestException);
      expect(h.taskFindById).not.toHaveBeenCalled();
      expect(h.projectFindById).not.toHaveBeenCalled();
    },
  );

  it('answers an unknown Move with not found', async () => {
    const h = harness({ handler: 'patch', owner: true, task: null });
    await expect(h.guard.canActivate(h.context)).rejects.toBeInstanceOf(NotFoundException);
    expect(h.projectFindById).not.toHaveBeenCalled();
  });

  it('refuses a Move without a project', async () => {
    for (const task of [{ _id: oid(taskId) }, { _id: oid(taskId), projectId: 'nope' }]) {
      const h = harness({ handler: 'patch', owner: true, task });
      await expect(h.guard.canActivate(h.context)).rejects.toBeInstanceOf(ForbiddenException);
      expect(h.projectFindById).not.toHaveBeenCalled();
    }
  });

  it('turns a database error into a refusal, without its details', async () => {
    for (const options of [{ rejectTask: true }, { rejectProject: true }]) {
      const h = harness({ handler: 'patch', owner: true, ...options });
      const error = await h.guard.canActivate(h.context).catch((e) => e);
      expect(error).toBeInstanceOf(ServiceUnavailableException);
      expect(String(error.message)).not.toContain('hidden');
    }
    const h = harness({ handler: 'create', owner: true, rejectProject: true });
    await expect(h.guard.canActivate(h.context)).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('refuses a change without a usable signed-in user', async () => {
    const users = [undefined, null, {}, { userId: null }, { userId: '' }, { userId: 'not-an-id' }, { sub: 12 }, { id: [actorId] }];
    for (const user of users) {
      const h = harness({ handler: 'patch', owner: true, user });
      await expect(h.guard.canActivate(h.context)).rejects.toBeInstanceOf(ForbiddenException);
      expect(h.taskFindById).not.toHaveBeenCalled();
      expect(h.projectFindById).not.toHaveBeenCalled();
    }
  });

  it('refuses methods it does not know', async () => {
    for (const method of ['OPTIONS', 'TRACE', 'CONNECT', '', 'get ']) {
      const h = harness({ handler: 'patch', owner: true, method });
      await expect(h.guard.canActivate(h.context)).rejects.toBeInstanceOf(ForbiddenException);
    }
  });

  it('treats a write it does not know as a change, not a follow', async () => {
    expect(await outcome({ handler: 'somethingNew', method: 'POST', role: 'viewer', taskId })).toBe('ForbiddenException');
    expect(await outcome({ handler: 'somethingNew', method: 'POST', role: 'member', taskId })).toBe('allowed');
    expect(await outcome({ handler: 'updateWatchSettingsAndMore', method: 'PATCH', role: 'viewer' })).toBe('ForbiddenException');
  });

  it('loads every project field the decision reads', async () => {
    const h = harness({ handler: 'patch', owner: true });
    await h.guard.canActivate(h.context);
    const fields = String(h.projectSelect.mock.calls[0][0]).split(' ');
    for (const field of ['ownerId', 'owner', 'createdBy', 'createdById', 'members', 'visibility', 'isPublic', 'public', 'settings.isPublic', 'status', 'isArchived']) {
      expect(fields).toContain(field);
    }
  });
});

describe('R51 project-scoped Move creation', () => {
  const proto = ProjectTasksController.prototype as any;

  it('keeps the existing project guard on both routes', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, proto.listByProject)).toEqual([JwtAuthGuard, ProjectAccessGuard]);
    expect(Reflect.getMetadata(GUARDS_METADATA, proto.createInProject)).toEqual([JwtAuthGuard, ProjectAccessGuard]);
  });

  it('lets only the owner, admins and members create Moves there', () => {
    expect(Reflect.getMetadata(PROJECT_ACCESS_KEY, proto.createInProject)).toEqual({
      param: 'projectId',
      intent: 'write',
      roles: ['owner', 'admin', 'member'],
    });
  });

  it('leaves reading there as it was', () => {
    expect(Reflect.getMetadata(PROJECT_ACCESS_KEY, proto.listByProject)).toEqual({
      param: 'projectId',
      intent: 'read',
      allowPublicRead: true,
    });
  });
});
