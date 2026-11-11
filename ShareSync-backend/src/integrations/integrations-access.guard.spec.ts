import 'reflect-metadata';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { GUARDS_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { Types } from 'mongoose';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PROJECT_STANDING_FIELDS } from '../common/guards/project-standing';
import { INTEGRATIONS_REFUSAL, IntegrationsAccessGuard } from './integrations-access.guard';
import { IntegrationsController } from './integrations.controller';

// openshare-integrations-access-v1 (R52)

const projectId = '507f1f77bcf86cd799439011';
const otherProjectId = '507f1f77bcf86cd799439013';
const actorId = '507f191e810c19729de860ea';
const otherId = '507f1f77bcf86cd799439012';
const integrationId = '64b7f0c2a1b2c3d4e5f60718';
const oid = (id: string) => new Types.ObjectId(id);

const GUARDED = [
  'initiateOAuth',
  'create',
  'findByProject',
  'findById',
  'updateSettings',
  'disconnect',
  'delete',
  'getGitHubRepos',
  'getSlackChannels',
  'sendSlackMessage',
  'getWebhookLogs',
];
const SIGNED_IN_ONLY = ['findByUser'];
const NO_USER = ['handleOAuthCallback', 'handleGitHubWebhook', 'handleSlackWebhook'];

type Standing = { owner?: boolean; role?: string | null; visibility?: string };

function projectWith(standing: Standing): any {
  return {
    ownerId: oid(standing.owner ? actorId : otherId),
    visibility: standing.visibility ?? 'private',
    members:
      standing.role === undefined
        ? [{ userId: oid(otherId), role: 'owner' }]
        : [standing.role === null ? { userId: oid(actorId) } : { userId: oid(actorId), role: standing.role }],
  };
}

type Options = {
  params?: any;
  query?: any;
  body?: any;
  user?: any;
  integration?: any;
  projects?: Record<string, any>;
  rejectProject?: boolean;
  rejectIntegration?: boolean;
};

function harness(options: Options = {}) {
  const projects = options.projects ?? { [projectId]: projectWith({ owner: true }) };
  const integration =
    options.integration !== undefined
      ? options.integration
      : { _id: oid(integrationId), projectId: oid(projectId), userId: oid(otherId) };
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
        if (options.rejectIntegration) throw new Error('hidden database details');
        return id === integrationId ? integration : null;
      }),
    })),
  };

  const guard = new IntegrationsAccessGuard(connection as any);
  const request = {
    params: options.params ?? { id: integrationId },
    query: options.query ?? {},
    body: options.body ?? {},
    user: Object.prototype.hasOwnProperty.call(options, 'user') ? options.user : { userId: actorId },
  };
  const context: any = { switchToHttp: () => ({ getRequest: () => request }) };
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

const MANAGERS: Array<[string, Standing]> = [
  ['the owner', { owner: true }],
  ['an admin', { role: 'admin' }],
  ['a member with the owner role', { role: 'owner' }],
];
const NOT_MANAGERS: Array<[string, Standing]> = [
  ['a member', { role: 'member' }],
  ['a member without a role', { role: null }],
  ['a viewer', { role: 'viewer' }],
  ['a guest', { role: 'guest' }],
  ['a spectator of a public project', { visibility: 'public' }],
  ['an outsider of a private project', {}],
];

describe('R52 integrations access: where it applies', () => {
  const proto = IntegrationsController.prototype as any;

  it('knows every route of the integrations controller, so a new one has to be placed here', () => {
    const names = Object.getOwnPropertyNames(proto).filter(
      (name) => name !== 'constructor' && typeof proto[name] === 'function' && Reflect.getMetadata(PATH_METADATA, proto[name]) !== undefined,
    );
    expect(names.sort()).toEqual([...GUARDED, ...SIGNED_IN_ONLY, ...NO_USER].sort());
  });

  it.each(GUARDED)('runs on %s after JWT authentication', (name) => {
    expect(Reflect.getMetadata(GUARDS_METADATA, proto[name])).toEqual([JwtAuthGuard, IntegrationsAccessGuard]);
  });

  it('leaves the list of your own integrations to JWT authentication alone', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, proto.findByUser)).toEqual([JwtAuthGuard]);
  });

  it('leaves the OAuth callback and the incoming webhooks as they were', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, IntegrationsController)).toBeUndefined();
    for (const name of NO_USER) {
      expect([name, Reflect.getMetadata(GUARDS_METADATA, proto[name])]).toEqual([name, undefined]);
    }
  });

  it('reads the address the way the guard expects', () => {
    expect(Reflect.getMetadata(PATH_METADATA, proto.initiateOAuth)).toBe('oauth/:type');
    expect(Reflect.getMetadata(PATH_METADATA, proto.findByProject)).toBe('project/:projectId');
    for (const name of GUARDED.filter((n) => !['initiateOAuth', 'create', 'findByProject'].includes(n))) {
      expect([name, Reflect.getMetadata(PATH_METADATA, proto[name])]).toEqual([name, expect.stringMatching(/^:id(\/|$)/)]);
    }
  });
});

describe('R52 integrations access: one integration by its ID', () => {
  it.each(MANAGERS)("lets %s use the project's integration", async (_label, standing) => {
    expect(await outcome({ projects: { [projectId]: projectWith(standing) } })).toBe('allowed');
  });

  it.each(NOT_MANAGERS)("refuses %s the project's integration", async (_label, standing) => {
    expect(await outcome({ projects: { [projectId]: projectWith(standing) } })).toBe('ForbiddenException');
  });

  it('refuses even the person who connected it once they no longer manage the project', async () => {
    const integration = { _id: oid(integrationId), projectId: oid(projectId), userId: oid(actorId) };
    expect(await outcome({ integration, projects: { [projectId]: projectWith({ role: 'member' }) } })).toBe('ForbiddenException');
  });

  it('refuses when the project is gone', async () => {
    expect(await outcome({ projects: {} })).toBe('ForbiddenException');
  });

  it('decides by the project the integration belongs to', async () => {
    const h = harness({});
    await expect(h.guard.canActivate(h.context)).resolves.toBe(true);
    expect(h.lookups.map(({ collection, id, byObjectId }) => [collection, id, byObjectId])).toEqual([
      ['integrations', integrationId, true],
      ['projects', projectId, true],
    ]);
    expect(h.lookups[0].projection).toEqual({ projectId: 1, userId: 1 });
    expect(Object.keys(h.lookups[1].projection).sort()).toEqual(PROJECT_STANDING_FIELDS.split(' ').sort());
  });

  it('lets only the person who connected a personal integration use it', async () => {
    for (const projectValue of [undefined, null, '', 'nope']) {
      const mine = { _id: oid(integrationId), projectId: projectValue, userId: oid(actorId) };
      const theirs = { _id: oid(integrationId), projectId: projectValue, userId: oid(otherId) };
      const orphan = { _id: oid(integrationId), projectId: projectValue };
      expect(await outcome({ integration: mine })).toBe('allowed');
      expect(await outcome({ integration: { ...mine, userId: actorId.toUpperCase() } })).toBe('allowed');
      expect(await outcome({ integration: theirs })).toBe('ForbiddenException');
      expect(await outcome({ integration: orphan })).toBe('ForbiddenException');
    }
  });

  it('answers an unknown integration with not found', async () => {
    const h = harness({ integration: null });
    await expect(h.guard.canActivate(h.context)).rejects.toBeInstanceOf(NotFoundException);
    expect(h.lookups.map(({ collection }) => collection)).toEqual(['integrations']);
  });

  it.each(['not-an-id', '', `${integrationId}0`, ` ${integrationId}`, 12, [integrationId]])(
    'refuses the malformed integration ID %p before the database',
    async (value) => {
      const h = harness({ params: { id: value } });
      await expect(h.guard.canActivate(h.context)).rejects.toBeInstanceOf(BadRequestException);
      expect(h.lookups).toEqual([]);
    },
  );

  it('decides by the integration ID even when the request names a project too', async () => {
    const projects = { [projectId]: projectWith({}), [otherProjectId]: projectWith({ owner: true }) };
    expect(
      await outcome({ projects, params: { id: integrationId, projectId: otherProjectId }, body: { projectId: otherProjectId } }),
    ).toBe('ForbiddenException');
  });
});

describe("R52 integrations access: a project's integrations", () => {
  it.each(MANAGERS)('lets %s list them', async (_label, standing) => {
    expect(await outcome({ params: { projectId }, projects: { [projectId]: projectWith(standing) } })).toBe('allowed');
  });

  it.each(NOT_MANAGERS)('refuses %s the list', async (_label, standing) => {
    expect(await outcome({ params: { projectId }, projects: { [projectId]: projectWith(standing) } })).toBe('ForbiddenException');
  });

  it.each(['not-an-id', '', `${projectId}0`, 12, [projectId]])(
    'refuses the malformed project ID %p before the database',
    async (value) => {
      const h = harness({ params: { projectId: value } });
      await expect(h.guard.canActivate(h.context)).rejects.toBeInstanceOf(ForbiddenException);
      expect(h.lookups).toEqual([]);
    },
  );
});

describe('R52 integrations access: connecting a new one', () => {
  it('lets anyone signed in connect a personal one, without the database', async () => {
    for (const body of [{}, { projectId: undefined }, { projectId: null }, { projectId: '' }, undefined]) {
      for (const params of [{}, { type: 'github' }]) {
        const h = harness({ params, body, projects: {} });
        await expect(h.guard.canActivate(h.context)).resolves.toBe(true);
        expect(h.lookups).toEqual([]);
      }
    }
  });

  it.each(MANAGERS)('lets %s connect one to the project, by body or by OAuth query', async (_label, standing) => {
    const projects = { [projectId]: projectWith(standing) };
    expect(await outcome({ params: {}, body: { projectId }, projects })).toBe('allowed');
    expect(await outcome({ params: { type: 'slack' }, query: { projectId }, projects })).toBe('allowed');
  });

  it.each(NOT_MANAGERS)('refuses %s connecting one to the project, by body or by OAuth query', async (_label, standing) => {
    const projects = { [projectId]: projectWith(standing) };
    expect(await outcome({ params: {}, body: { projectId }, projects })).toBe('ForbiddenException');
    expect(await outcome({ params: { type: 'slack' }, query: { projectId }, projects })).toBe('ForbiddenException');
  });

  it('needs every project the request names to be one the caller manages', async () => {
    const projects = { [projectId]: projectWith({ owner: true }), [otherProjectId]: projectWith({}) };
    expect(await outcome({ params: {}, body: { projectId }, query: { projectId: otherProjectId }, projects })).toBe('ForbiddenException');
    expect(await outcome({ params: {}, body: { projectId: otherProjectId }, query: { projectId }, projects })).toBe('ForbiddenException');
    expect(await outcome({ params: {}, body: { projectId }, query: { projectId }, projects })).toBe('allowed');
  });

  it.each(['not-an-id', `${projectId}0`, ` ${projectId}`, 12, true, [projectId], { $ne: null }])(
    'refuses the malformed project ID %p before the database',
    async (value) => {
      for (const where of ['body', 'query'] as const) {
        const h = harness({ params: {}, [where]: { projectId: value } });
        await expect(h.guard.canActivate(h.context)).rejects.toBeInstanceOf(ForbiddenException);
        expect(h.lookups).toEqual([]);
      }
    },
  );
});

describe('R52 integrations access: failures', () => {
  it('refuses without a usable signed-in user, before the database', async () => {
    for (const user of [undefined, null, {}, { userId: null }, { userId: '' }, { userId: 'not-an-id' }, { sub: 12 }, { id: [actorId] }]) {
      for (const shape of [{ params: { id: integrationId } }, { params: { projectId } }, { params: {}, body: {} }]) {
        const h = harness({ ...shape, user });
        await expect(h.guard.canActivate(h.context)).rejects.toBeInstanceOf(ForbiddenException);
        expect(h.lookups).toEqual([]);
      }
    }
  });

  it('turns a database error into a refusal, without its details', async () => {
    const cases: Options[] = [
      { rejectIntegration: true },
      { rejectProject: true },
      { params: { projectId }, rejectProject: true },
      { params: {}, body: { projectId }, rejectProject: true },
    ];
    for (const options of cases) {
      const h = harness(options);
      const error = await h.guard.canActivate(h.context).catch((e) => e);
      expect(error).toBeInstanceOf(ServiceUnavailableException);
      expect(JSON.stringify(error.getResponse())).not.toContain('hidden');
    }
  });

  it('refuses with one plain message', async () => {
    const h = harness({ projects: { [projectId]: projectWith({}) } });
    const error = await h.guard.canActivate(h.context).catch((e) => e);
    expect(error).toBeInstanceOf(ForbiddenException);
    expect(error.message).toBe(INTEGRATIONS_REFUSAL);
  });
});
