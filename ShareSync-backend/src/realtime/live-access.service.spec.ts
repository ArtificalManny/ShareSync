import { Types } from 'mongoose';
import { LiveAccessService, MEMBER_STANDINGS, PUBLIC_STANDINGS } from './live-access.service';

// openshare-live-access-v1 (R52b)

const projectId = '507f1f77bcf86cd799439011';
const owner = '507f191e810c19729de860ea';
const member = '507f1f77bcf86cd799439012';
const viewer = '507f1f77bcf86cd799439013';
const outsider = '507f1f77bcf86cd799439014';
const removed = '507f1f77bcf86cd799439015';
const oid = (id: string) => new Types.ObjectId(id);

type Options = {
  project?: any;
  users?: Record<string, number>;
  failProject?: boolean;
  failUsers?: boolean;
  sessionUser?: any;
};

function projectDoc(extra: any = {}) {
  return {
    _id: oid(projectId),
    ownerId: oid(owner),
    visibility: 'private',
    members: [
      { userId: oid(member), role: 'member' },
      { userId: oid(viewer), role: 'viewer' },
    ],
    ...extra,
  };
}

function connectionWith(options: Options = {}) {
  const lookups: string[] = [];
  const users = options.users ?? { [owner]: 0, [member]: 0, [viewer]: 0, [outsider]: 0, [removed]: 0 };
  return {
    lookups,
    connection: {
      collection: jest.fn((name: string) =>
        name === 'projects'
          ? {
              findOne: jest.fn(async (filter: any) => {
                lookups.push(`projects:${filter._id.toHexString()}`);
                if (options.failProject) throw new Error('hidden database details');
                return options.project === undefined ? projectDoc() : options.project;
              }),
            }
          : {
              find: jest.fn((filter: any) => ({
                toArray: async () => {
                  lookups.push(`users:${filter._id.$in.length}`);
                  if (options.failUsers) throw new Error('hidden database details');
                  return Object.entries(users).map(([id, tokenVersion]) => ({ _id: oid(id), tokenVersion }));
                },
              })),
            },
      ),
      models: {
        User: {
          findById: jest.fn(() => ({
            select: () => ({ lean: () => ({ exec: async () => options.sessionUser ?? null }) }),
          })),
        },
      },
    } as any,
  };
}

function socket(id: string, data: any = {}, handshake: any = {}) {
  return {
    id,
    data,
    handshake,
    emitted: [] as Array<[string, unknown]>,
    left: [] as string[],
    disconnected: false,
    emit(event: string, payload: unknown) {
      this.emitted.push([event, payload]);
      return true;
    },
    leave(room: string) {
      this.left.push(room);
    },
    disconnect() {
      this.disconnected = true;
      return this;
    },
  };
}

function serverWith(rooms: Record<string, any[]>) {
  const asked: string[] = [];
  return {
    asked,
    server: {
      in: jest.fn((room: string) => ({
        fetchSockets: async () => {
          asked.push(room);
          return rooms[room] ?? [];
        },
      })),
    } as any,
  };
}

const signedIn = (userId: string, tokenVersion = 0) => ({ userId, tokenVersion });

describe('R52b live access: signing a socket in', () => {
  const jwt = (payload: any) => ({
    verify: jest.fn((token: string) => {
      if (token === 'good-token') return payload;
      throw new Error('invalid signature');
    }),
  });

  it('signs in a socket with a valid token and a current session, once', async () => {
    const { connection } = connectionWith({ sessionUser: { _id: oid(member), tokenVersion: 3 } });
    const service = new LiveAccessService(connection);
    const verifier = jwt({ sub: member, tokenVersion: 3 });
    const s = socket('s1', {}, { auth: { token: 'good-token' } });

    await expect(service.signIn(s as any, verifier as any)).resolves.toBe(member);
    await expect(service.signIn(s as any, verifier as any)).resolves.toBe(member);
    expect(verifier.verify).toHaveBeenCalledTimes(1);
    expect(s.data).toMatchObject({ userId: member, tokenVersion: 3 });
  });

  it('accepts the token from a Bearer header too', async () => {
    const { connection } = connectionWith({ sessionUser: { _id: oid(member), tokenVersion: 0 } });
    const s = socket('s1', {}, { headers: { authorization: 'Bearer good-token' } });
    await expect(new LiveAccessService(connection).signIn(s as any, jwt({ sub: member }) as any)).resolves.toBe(member);
  });

  it.each([
    ['no token', {}],
    ['an empty token', { auth: { token: '' } }],
    ['a token that is not text', { auth: { token: { $ne: null } } }],
    ['a bad signature', { auth: { token: 'forged-token' } }],
    ['a header that is not Bearer', { headers: { authorization: 'Basic good-token' } }],
  ])('refuses %s', async (_label, handshake) => {
    const { connection } = connectionWith({ sessionUser: { _id: oid(member), tokenVersion: 0 } });
    const s = socket('s1', {}, handshake);
    await expect(new LiveAccessService(connection).signIn(s as any, jwt({ sub: member }) as any)).resolves.toBe('');
    expect(s.data.userId).toBeUndefined();
  });

  it('refuses a token whose session was revoked or whose account is gone', async () => {
    for (const sessionUser of [{ _id: oid(member), tokenVersion: 4 }, null]) {
      const { connection } = connectionWith({ sessionUser });
      const s = socket('s1', {}, { auth: { token: 'good-token' } });
      await expect(new LiveAccessService(connection).signIn(s as any, jwt({ sub: member, tokenVersion: 3 }) as any)).resolves.toBe('');
      expect(s.data.userId).toBeUndefined();
    }
  });
});

describe('R52b live access: standing in a project', () => {
  it('reads the standing from the project as it is now', async () => {
    const { connection } = connectionWith();
    const service = new LiveAccessService(connection);
    expect(await service.standingOf(projectId, owner)).toBe('writer');
    expect(await service.standingOf(projectId, member)).toBe('writer');
    expect(await service.standingOf(projectId, viewer)).toBe('reader');
    expect(await service.standingOf(projectId, outsider)).toBe('none');
  });

  it('counts malformed IDs, a missing project and a database error as no standing', async () => {
    const { connection, lookups } = connectionWith();
    const service = new LiveAccessService(connection);
    for (const bad of ['not-an-id', ` ${projectId}`, 12, null, { $ne: null }] as any[]) {
      expect(await service.standingOf(bad, owner)).toBe('none');
    }
    expect(await service.standingOf(projectId, 'not-an-id')).toBe('none');
    expect(lookups).toEqual([]);
    expect(await new LiveAccessService(connectionWith({ project: null }).connection).standingOf(projectId, owner)).toBe('none');
    expect(await new LiveAccessService(connectionWith({ failProject: true }).connection).standingOf(projectId, owner)).toBe('none');
  });

  it('lets members, not spectators, into project rooms', () => {
    expect([...MEMBER_STANDINGS].sort()).toEqual(['reader', 'writer']);
    expect([...PUBLIC_STANDINGS].sort()).toEqual(['reader', 'spectator', 'writer']);
  });
});

describe('R52b live access: sending to a project room', () => {
  function room() {
    return {
      owner: socket('owner', signedIn(owner)),
      member: socket('member', signedIn(member)),
      viewer: socket('viewer', signedIn(viewer)),
      outsider: socket('outsider', signedIn(outsider)),
      removed: socket('removed', signedIn(removed)),
      revoked: socket('revoked', signedIn(member, 1)),
      anonymous: socket('anonymous', {}),
      ghost: socket('ghost', signedIn('507f1f77bcf86cd799439099')),
    };
  }

  it('sends only to the owner and members, and takes everyone else out', async () => {
    const r = room();
    const { server } = serverWith({ [`project:${projectId}`]: Object.values(r) });
    await new LiveAccessService(connectionWith().connection).sendToProject(server, projectId, 'taskUpdated', { title: 'secret' });

    for (const name of ['owner', 'member', 'viewer'] as const) {
      expect([name, r[name].emitted]).toEqual([name, [['taskUpdated', { title: 'secret' }]]]);
    }
    for (const name of ['outsider', 'removed'] as const) {
      expect([name, r[name].emitted, r[name].left, r[name].disconnected]).toEqual([name, [], [`project:${projectId}`], false]);
    }
    for (const name of ['revoked', 'anonymous', 'ghost'] as const) {
      expect([name, r[name].emitted, r[name].disconnected]).toEqual([name, [], true]);
    }
  });

  it('keeps spectators of a public project out of its project room', async () => {
    const spectator = socket('spectator', signedIn(outsider));
    const theViewer = socket('viewer', signedIn(viewer));
    const { server } = serverWith({ [`project:${projectId}`]: [spectator, theViewer] });
    const project = projectDoc({ visibility: 'public' });
    await new LiveAccessService(connectionWith({ project }).connection).sendToProject(server, projectId, 'taskUpdated', { title: 'x' });
    expect([spectator.emitted, spectator.left]).toEqual([[], [`project:${projectId}`]]);
    expect(theViewer.emitted).toEqual([['taskUpdated', { title: 'x' }]]);
  });

  it('leaves out the socket the update came from', async () => {
    const r = room();
    const { server } = serverWith({ [`project:${projectId}`]: [r.owner, r.member] });
    await new LiveAccessService(connectionWith().connection).sendToProject(server, projectId, 'userJoined', {}, 'member');
    expect(r.owner.emitted).toHaveLength(1);
    expect(r.member.emitted).toEqual([]);
  });

  it('takes everyone out when the project is gone', async () => {
    const r = room();
    const { server } = serverWith({ [`project:${projectId}`]: [r.owner, r.member] });
    await new LiveAccessService(connectionWith({ project: null }).connection).sendToProject(server, projectId, 'taskUpdated', {});
    expect([r.owner.emitted, r.member.emitted]).toEqual([[], []]);
    expect([r.owner.left, r.member.left]).toEqual([[`project:${projectId}`], [`project:${projectId}`]]);
  });

  it('sends nothing and changes nothing when the database cannot be asked', async () => {
    for (const options of [{ failProject: true }, { failUsers: true }]) {
      const r = room();
      const { server } = serverWith({ [`project:${projectId}`]: Object.values(r) });
      await new LiveAccessService(connectionWith(options).connection).sendToProject(server, projectId, 'taskUpdated', {});
      for (const s of Object.values(r)) {
        expect([s.id, s.emitted, s.left, s.disconnected]).toEqual([s.id, [], [], false]);
      }
    }
  });

  it('ignores a malformed project ID, a missing server and a missing event', async () => {
    const r = room();
    const { server, asked } = serverWith({ [`project:${projectId}`]: Object.values(r) });
    const service = new LiveAccessService(connectionWith().connection);
    for (const bad of ['not-an-id', `${projectId}0`, 12, null, { $ne: null }] as any[]) {
      await service.sendToProject(server, bad, 'taskUpdated', {});
    }
    await service.sendToProject(undefined, projectId, 'taskUpdated', {});
    await service.sendToProject(server, projectId, '', {});
    expect(asked).toEqual([]);
    expect(Object.values(r).every((s) => s.emitted.length === 0)).toBe(true);
  });

  it('answers who may be in the room', async () => {
    const r = room();
    const { server } = serverWith({ [`project:${projectId}`]: Object.values(r) });
    const allowed = await new LiveAccessService(connectionWith().connection).allowedInProject(server, projectId);
    expect(allowed.map((s) => s.id).sort()).toEqual(['member', 'owner', 'viewer']);
  });

  it('looks the project up once per send, however many sockets there are', async () => {
    const r = room();
    const { server } = serverWith({ [`project:${projectId}`]: Object.values(r) });
    const { connection, lookups } = connectionWith();
    await new LiveAccessService(connection).sendToProject(server, projectId, 'taskUpdated', {});
    expect(lookups).toEqual([`projects:${projectId}`, 'users:6']);
  });
});

describe('R52b live access: public project rooms and person rooms', () => {
  it('sends a public project room to spectators while the project is public or listed and not archived', async () => {
    for (const [project, spectatorGetsIt] of [
      [projectDoc({ visibility: 'public' }), true],
      [projectDoc({ visibility: 'listed' }), true],
      [projectDoc({ visibility: 'public', status: 'archived' }), false],
      [projectDoc({ visibility: 'public', isArchived: true }), false],
      [projectDoc(), false],
    ] as Array<[any, boolean]>) {
      const spectator = socket('spectator', signedIn(outsider));
      const theMember = socket('member', signedIn(member));
      const { server } = serverWith({ [`public:project:${projectId}`]: [spectator, theMember] });
      await new LiveAccessService(connectionWith({ project }).connection).sendToPublicProject(server, projectId, 'public:project:update', {});
      expect([project.visibility, project.status, spectator.emitted.length]).toEqual([project.visibility, project.status, spectatorGetsIt ? 1 : 0]);
      expect(spectator.left).toEqual(spectatorGetsIt ? [] : [`public:project:${projectId}`]);
      expect(theMember.emitted).toHaveLength(1);
    }
  });

  it('sends a person room only to that person\'s current sessions', async () => {
    const own = socket('own', signedIn(member));
    const intruder = socket('intruder', signedIn(outsider));
    const revoked = socket('revoked', signedIn(member, 1));
    const anonymous = socket('anonymous', {});
    const { server } = serverWith({ [`user:${member}`]: [own, intruder, revoked, anonymous] });
    await new LiveAccessService(connectionWith().connection).sendToUser(server, member.toUpperCase(), 'user:updated', { displayName: 'x' });
    expect(own.emitted).toEqual([['user:updated', { displayName: 'x' }]]);
    expect([intruder.emitted, intruder.left, intruder.disconnected]).toEqual([[], [`user:${member}`], false]);
    expect([revoked.emitted, revoked.disconnected]).toEqual([[], true]);
    expect([anonymous.emitted, anonymous.disconnected]).toEqual([[], true]);
  });
});
