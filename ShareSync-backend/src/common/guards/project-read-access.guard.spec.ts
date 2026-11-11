import 'reflect-metadata';
import { ForbiddenException, RequestMethod, ServiceUnavailableException } from '@nestjs/common';
import { GUARDS_METADATA, METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { Types } from 'mongoose';
import { AIController } from '../../ai/ai.controller';
import { AnalyticsController } from '../../analytics/analytics.controller';
import { UserStatsController } from '../../analytics/user-stats.controller';
import { JwtAuthGuard as JwtAuthGuardInGuards } from '../../auth/guards/jwt-auth.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { GamificationController } from '../../gamification/gamification.controller';
import { MilestonesController } from '../../milestones/milestones.controller';
import { ProjectMilestonesController } from '../../milestones/project-milestones.controller';
import { CursorController } from '../../realtime/cursor.controller';
import { FocusController } from '../../realtime/focus.controller';
import { PresenceController } from '../../realtime/presence.controller';
import {
  PROJECT_READ_ACCESS,
  PROJECT_READ_REFUSAL,
  ProjectReadAccessGuard,
} from './project-read-access.guard';
import { PROJECT_STANDING_FIELDS } from './project-standing';

// openshare-project-read-access-v1 (R52)

const projectId = '507f1f77bcf86cd799439011';
const otherProjectId = '507f1f77bcf86cd799439013';
const actorId = '507f191e810c19729de860ea';
const otherId = '507f1f77bcf86cd799439012';
const milestoneId = '64b7f0c2a1b2c3d4e5f60718';
const oid = (id: string) => new Types.ObjectId(id);

type Route = { label: string; controller: any; handler: string; method: string; options?: any };

// Every route R52 puts behind the guard, with where it reads its project from.
// No options means the default: the :projectId in the address.
const ROUTES: Route[] = [
  { label: 'project overview', controller: AnalyticsController, handler: 'getProjectOverview', method: 'GET' },
  { label: 'project health', controller: AnalyticsController, handler: 'getProjectHealth', method: 'GET' },
  { label: 'project velocity', controller: AnalyticsController, handler: 'getVelocityTrend', method: 'GET' },
  { label: 'project forecast', controller: AnalyticsController, handler: 'getCompletionForecast', method: 'GET' },
  { label: 'project team', controller: AnalyticsController, handler: 'getTeamProductivity', method: 'GET' },
  { label: 'project activity', controller: AnalyticsController, handler: 'getRecentActivity', method: 'GET' },
  { label: 'project leaderboard', controller: GamificationController, handler: 'getProjectLeaderboard', method: 'GET' },
  { label: 'who is in the project', controller: PresenceController, handler: 'getProjectUsers', method: 'GET' },
  { label: 'joining a project', controller: PresenceController, handler: 'joinProject', method: 'POST' },
  { label: 'recent cursors', controller: CursorController, handler: 'getRecentInProject', method: 'GET' },
  { label: 'active cursors', controller: CursorController, handler: 'getActiveUsers', method: 'GET' },
  { label: 'focus sessions', controller: FocusController, handler: 'getProjectSessions', method: 'GET' },
  { label: 'project milestones', controller: ProjectMilestonesController, handler: 'list', method: 'GET' },
  { label: 'milestone list', controller: MilestonesController, handler: 'findAll', method: 'GET', options: { query: 'projectId' } },
  {
    label: 'one milestone',
    controller: MilestonesController,
    handler: 'findOne',
    method: 'GET',
    options: { entity: { collection: 'milestones', param: 'id' } },
  },
  { label: 'AI chat', controller: AIController, handler: 'chat', method: 'POST', options: { body: 'projectId', optional: true } },
  { label: 'user stats', controller: UserStatsController, handler: 'get', method: 'GET', options: { query: 'projectId', optional: true } },
];
const route = (handler: string) => ROUTES.find((r) => r.handler === handler) as Route;
const TABLE = ROUTES.map((r) => [r.label, r] as [string, Route]);

const VERBS: Record<number, string> = {
  [RequestMethod.GET]: 'GET',
  [RequestMethod.POST]: 'POST',
  [RequestMethod.PUT]: 'PUT',
  [RequestMethod.DELETE]: 'DELETE',
  [RequestMethod.PATCH]: 'PATCH',
};

type Standing = { owner?: boolean; role?: string | null; visibility?: string; archived?: boolean };

function projectWith(standing: Standing): any {
  return {
    _id: oid(projectId),
    ownerId: oid(standing.owner ? actorId : otherId),
    visibility: standing.visibility ?? 'private',
    isArchived: standing.archived === true,
    members:
      standing.role === undefined
        ? [{ userId: oid(otherId), role: 'owner' }]
        : [standing.role === null ? { userId: oid(actorId) } : { userId: oid(actorId), role: standing.role }],
  };
}

// A request with `value` where the route reads its ID: for the milestone route
// that is the milestone ID; its record points at the project.
function placing(r: Route, value: unknown): { params?: any; query?: any; body?: any } {
  const options = r.options;
  if (options?.entity) return { params: { [options.entity.param]: value } };
  if (options?.query) return { params: { userId: actorId }, query: { [options.query]: value } };
  if (options?.body) return { body: { [options.body]: value, prompt: 'How is it going?' } };
  return { params: { projectId: value } };
}
const usual = (r: Route) => placing(r, r.options?.entity ? milestoneId : projectId);

type Options = {
  route?: Route;
  request?: { params?: any; query?: any; body?: any };
  user?: any;
  projects?: Record<string, any>;
  records?: Record<string, any>;
  rejectProject?: boolean;
  rejectRecord?: boolean;
};

function harness(options: Options = {}) {
  const r = options.route ?? ROUTES[0];
  const projects = options.projects ?? { [projectId]: projectWith({ owner: true }) };
  const records = options.records ?? { [milestoneId]: { _id: oid(milestoneId), projectId: oid(projectId) } };
  const lookups: Array<{ collection: string; id: string; byObjectId: boolean; projection: any }> = [];

  const connection = {
    collection: jest.fn((collection: string) => ({
      findOne: jest.fn(async (filter: any, findOptions: any) => {
        const byObjectId = filter?._id instanceof Types.ObjectId;
        const id = byObjectId ? filter._id.toHexString() : String(filter?._id);
        lookups.push({ collection, id, byObjectId, projection: findOptions?.projection });
        if (collection === 'projects') {
          if (options.rejectProject) throw new Error('hidden database details');
          return projects[id] ?? null;
        }
        if (options.rejectRecord) throw new Error('hidden database details');
        return records[id] ?? null;
      }),
    })),
  };

  const guard = new ProjectReadAccessGuard(new Reflector(), connection as any);
  const shape = options.request ?? usual(r);
  const request = {
    params: shape.params ?? {},
    query: shape.query ?? {},
    body: shape.body ?? {},
    user: Object.prototype.hasOwnProperty.call(options, 'user') ? options.user : { userId: actorId },
  };
  const context: any = {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => r.controller.prototype[r.handler],
    getClass: () => r.controller,
  };
  return { guard, context, lookups };
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

describe('R52 project read access: where it applies', () => {
  const reflector = new Reflector();

  it.each(TABLE)('%s runs it after JWT authentication', (_label, r) => {
    const classGuards = Reflect.getMetadata(GUARDS_METADATA, r.controller) ?? [];
    const methodGuards = Reflect.getMetadata(GUARDS_METADATA, r.controller.prototype[r.handler]) ?? [];
    const chain = [...classGuards, ...methodGuards];
    expect([JwtAuthGuard, JwtAuthGuardInGuards]).toContain(chain[0]);
    expect(chain.filter((guard: any) => guard === ProjectReadAccessGuard)).toHaveLength(1);
    expect(chain.indexOf(ProjectReadAccessGuard)).toBeGreaterThan(0);
  });

  it.each(TABLE)('%s is the route it should be and reads its project from the right place', (_label, r) => {
    const handler = r.controller.prototype[r.handler];
    expect(typeof handler).toBe('function');
    expect(VERBS[Reflect.getMetadata(METHOD_METADATA, handler)]).toBe(r.method);
    expect(reflector.getAllAndOverride(PROJECT_READ_ACCESS, [handler, r.controller])).toEqual(r.options);
    if (!r.options) {
      const path = `${Reflect.getMetadata(PATH_METADATA, r.controller)}/${Reflect.getMetadata(PATH_METADATA, handler)}`;
      expect(path).toContain(':projectId');
    }
  });

  it('covers the whole user stats controller, which had no authentication before', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, UserStatsController)).toEqual([JwtAuthGuard, ProjectReadAccessGuard]);
  });
});

describe('R52 project read access: who may read', () => {
  const READERS: Array<[string, Standing]> = [
    ['the owner', { owner: true }],
    ['an admin', { role: 'admin' }],
    ['a member', { role: 'member' }],
    ['a member without a role', { role: null }],
    ['a viewer', { role: 'viewer' }],
    ['a guest', { role: 'guest' }],
    ['a spectator of a public project', { visibility: 'public' }],
    ['a spectator of a listed project', { visibility: 'listed' }],
    ['the owner of an archived project', { owner: true, archived: true }],
    ['a member of an archived project', { role: 'member', archived: true }],
  ];
  const OUTSIDERS: Array<[string, Standing]> = [
    ['an outsider of a private project', {}],
    ['an outsider of a project without a visibility', { visibility: '' }],
    ['an outsider of an archived public project', { visibility: 'public', archived: true }],
  ];

  it.each(READERS)('lets %s read on every route', async (_label, standing) => {
    for (const r of ROUTES) {
      expect([r.label, await outcome({ route: r, projects: { [projectId]: projectWith(standing) } })]).toEqual([r.label, 'allowed']);
    }
  });

  it.each(OUTSIDERS)('refuses %s on every route', async (_label, standing) => {
    for (const r of ROUTES) {
      expect([r.label, await outcome({ route: r, projects: { [projectId]: projectWith(standing) } })]).toEqual([
        r.label,
        'ForbiddenException',
      ]);
    }
  });

  it('refuses when the project does not exist', async () => {
    for (const r of ROUTES) {
      expect([r.label, await outcome({ route: r, projects: {} })]).toEqual([r.label, 'ForbiddenException']);
    }
  });

  it('refuses with one plain message that says nothing about the project', async () => {
    for (const projects of [{ [projectId]: projectWith({}) }, {}]) {
      const h = harness({ projects });
      const error = await h.guard.canActivate(h.context).catch((e) => e);
      expect(error).toBeInstanceOf(ForbiddenException);
      expect(error.message).toBe(PROJECT_READ_REFUSAL);
    }
  });

  it('decides by the project where the route reads it, not one named somewhere else', async () => {
    const projects = { [projectId]: projectWith({}), [otherProjectId]: projectWith({ owner: true }) };
    expect(
      await outcome({
        route: route('getProjectOverview'),
        projects,
        request: { params: { projectId }, query: { projectId: otherProjectId }, body: { projectId: otherProjectId } },
      }),
    ).toBe('ForbiddenException');
    expect(
      await outcome({ route: route('findAll'), projects, request: { params: { projectId: otherProjectId }, query: { projectId } } }),
    ).toBe('ForbiddenException');
    expect(
      await outcome({ route: route('chat'), projects, request: { query: { projectId: otherProjectId }, body: { projectId } } }),
    ).toBe('ForbiddenException');
    expect(
      await outcome({
        route: route('get'),
        projects,
        request: { params: { userId: actorId }, body: { projectId: otherProjectId }, query: { projectId } },
      }),
    ).toBe('ForbiddenException');
  });

  it('looks the project up by its ObjectId, whatever the case of the ID', async () => {
    const h = harness({ request: { params: { projectId: projectId.toUpperCase() } } });
    await expect(h.guard.canActivate(h.context)).resolves.toBe(true);
    expect(h.lookups.map(({ collection, id, byObjectId }) => [collection, id, byObjectId])).toEqual([
      ['projects', projectId, true],
    ]);
  });

  it('loads exactly the project fields the decision reads', async () => {
    const h = harness({});
    await h.guard.canActivate(h.context);
    expect(Object.keys(h.lookups[0].projection).sort()).toEqual(PROJECT_STANDING_FIELDS.split(' ').sort());
  });
});

describe('R52 project read access: requests it refuses early', () => {
  it('lets a request that names no project through only where the route then answers without one', async () => {
    for (const r of ROUTES) {
      for (const value of [undefined, null, '']) {
        const h = harness({ route: r, request: placing(r, value) });
        const result = await h.guard.canActivate(h.context).then(
          () => 'allowed',
          (error) => error?.constructor?.name,
        );
        expect([r.label, value, result]).toEqual([r.label, value, r.options?.optional ? 'allowed' : 'ForbiddenException']);
        expect(h.lookups).toEqual([]);
      }
    }
  });

  it.each([
    'not-an-id',
    `${projectId}0`,
    projectId.slice(1),
    ` ${projectId}`,
    `${projectId} `,
    12,
    true,
    [projectId],
    { $ne: null },
    { toString: () => projectId },
  ])('refuses the malformed ID %p on every route, before the database', async (value) => {
    for (const r of ROUTES) {
      const h = harness({ route: r, request: placing(r, value) });
      await expect(h.guard.canActivate(h.context)).rejects.toBeInstanceOf(ForbiddenException);
      expect([r.label, h.lookups]).toEqual([r.label, []]);
    }
  });

  it('refuses a request without a usable signed-in user, before the database', async () => {
    const users = [undefined, null, {}, { userId: null }, { userId: '' }, { userId: 'not-an-id' }, { sub: 12 }, { id: [actorId] }];
    for (const r of ROUTES) {
      for (const user of users) {
        const h = harness({ route: r, user });
        await expect(h.guard.canActivate(h.context)).rejects.toBeInstanceOf(ForbiddenException);
        expect([r.label, h.lookups]).toEqual([r.label, []]);
      }
    }
  });

  it('turns a database error into a refusal, without its details', async () => {
    const cases: Options[] = [
      { route: route('getProjectOverview'), rejectProject: true },
      { route: route('chat'), rejectProject: true },
      { route: route('findOne'), rejectRecord: true },
      { route: route('findOne'), rejectProject: true },
    ];
    for (const options of cases) {
      const h = harness(options);
      const error = await h.guard.canActivate(h.context).catch((e) => e);
      expect(error).toBeInstanceOf(ServiceUnavailableException);
      expect(JSON.stringify(error.getResponse())).not.toContain('hidden');
    }
  });
});

describe('R52 project read access: a milestone by its ID', () => {
  const one = route('findOne');

  it('decides by the project the milestone belongs to', async () => {
    const h = harness({ route: one });
    await expect(h.guard.canActivate(h.context)).resolves.toBe(true);
    expect(h.lookups.map(({ collection, id, byObjectId }) => [collection, id, byObjectId])).toEqual([
      ['milestones', milestoneId, true],
      ['projects', projectId, true],
    ]);
    expect(h.lookups[0].projection).toEqual({ projectId: 1 });
  });

  it('refuses a milestone of a private project the user is not in', async () => {
    expect(await outcome({ route: one, projects: { [projectId]: projectWith({}) } })).toBe('ForbiddenException');
  });

  it('reads a milestone whose project ID is stored as text', async () => {
    const records = { [milestoneId]: { _id: oid(milestoneId), projectId } };
    expect(await outcome({ route: one, records })).toBe('allowed');
    expect(await outcome({ route: one, records, projects: { [projectId]: projectWith({}) } })).toBe('ForbiddenException');
  });

  it('leaves an unknown milestone to the route, which answers not found as before', async () => {
    const h = harness({ route: one, records: {} });
    await expect(h.guard.canActivate(h.context)).resolves.toBe(true);
    expect(h.lookups.map(({ collection }) => collection)).toEqual(['milestones']);
  });

  it('refuses a milestone without a usable project', async () => {
    for (const projectValue of [undefined, null, '', 'nope', 12, { $ne: null }]) {
      const records = { [milestoneId]: { _id: oid(milestoneId), projectId: projectValue } };
      const h = harness({ route: one, records });
      await expect(h.guard.canActivate(h.context)).rejects.toBeInstanceOf(ForbiddenException);
      expect(h.lookups.map(({ collection }) => collection)).toEqual(['milestones']);
    }
  });
});
