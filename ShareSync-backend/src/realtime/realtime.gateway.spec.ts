import { RealtimeGateway } from './realtime.gateway';

// openshare-live-access-v1 (R52b)

const projectId = '507f1f77bcf86cd799439011';
const me = '507f191e810c19729de860ea';
const other = '507f1f77bcf86cd799439012';

function socket(id = 'sock-1', handshake: any = {}) {
  const rooms = new Set<string>([id]);
  return {
    id,
    rooms,
    handshake,
    data: {} as any,
    join: jest.fn(async (room: string) => {
      rooms.add(room);
    }),
    leave: jest.fn(async (room: string) => {
      rooms.delete(room);
    }),
    emit: jest.fn(),
    disconnect: jest.fn(),
  };
}

function setup(options: { userId?: string; standing?: string; allowed?: any[] } = {}) {
  const disconnectSockets = jest.fn();
  const server = { in: jest.fn(() => ({ disconnectSockets })) };
  const live = {
    signIn: jest.fn(async (s: any) => {
      const userId = options.userId === undefined ? me : options.userId;
      if (userId) s.data.userId = userId;
      return userId;
    }),
    standingOf: jest.fn(async () => options.standing ?? 'writer'),
    sendToProject: jest.fn(async () => undefined),
    sendToUser: jest.fn(async () => undefined),
    allowedInProject: jest.fn(async () => options.allowed ?? []),
  };
  const realtime = { setServer: jest.fn() };
  const gateway = new RealtimeGateway(realtime as any, live as any, { verify: jest.fn() } as any);
  gateway.server = server as any;
  return { gateway, live, server, disconnectSockets };
}

describe('R52b main live-update channel: signing in', () => {
  it('closes a connection that cannot sign in, and joins nothing', async () => {
    const { gateway } = setup({ userId: '' });
    const s = socket();
    await gateway.handleConnection(s as any);
    expect(s.disconnect).toHaveBeenCalledWith(true);
    expect(s.join).not.toHaveBeenCalled();
  });

  it('puts a signed-in connection in its own person room', async () => {
    const { gateway } = setup();
    const s = socket();
    await gateway.handleConnection(s as any);
    expect(s.disconnect).not.toHaveBeenCalled();
    expect(s.join).toHaveBeenCalledWith(`user:${me}`);
  });

  it('closes a socket that asks for a room without a sign-in', async () => {
    const { gateway, live } = setup({ userId: '' });
    for (const [handler, body] of [
      ['joinProject', { projectId }],
      ['joinUser', { userId: me }],
      ['joinRoom', `project:${projectId}`],
      ['updatePresence', { projectId }],
    ] as const) {
      const s = socket();
      await (gateway as any)[handler](body, s);
      expect([handler, s.join.mock.calls.length, s.disconnect.mock.calls.length]).toEqual([handler, 0, 1]);
    }
    expect(live.standingOf).not.toHaveBeenCalled();
  });

  it('disconnects a deleted account at once', () => {
    const { gateway, server, disconnectSockets } = setup();
    gateway.handleAccountDeleted({ userId: other });
    expect(server.in).toHaveBeenCalledWith(`user:${other}`);
    expect(disconnectSockets).toHaveBeenCalledWith(true);
  });
});

describe('R52b main live-update channel: project rooms', () => {
  it.each(['writer', 'reader'])('lets a %s into the project room and tells the room', async (standing) => {
    const roomMate = { id: 'sock-2', data: { userId: other }, emit: jest.fn() };
    const { gateway, live } = setup({ standing, allowed: [roomMate] });
    const s = socket('sock-1', { auth: { userId: 'spoofed-name' } });
    await gateway.joinProject({ projectId: projectId.toUpperCase(), userId: 'spoofed-too' }, s as any);

    expect(live.standingOf).toHaveBeenCalledWith(projectId, me);
    expect(s.join).toHaveBeenCalledWith(`project:${projectId}`);
    expect(s.emit).toHaveBeenCalledWith('joinedProject', { room: `project:${projectId}` });
    expect(live.sendToProject).toHaveBeenCalledWith(
      expect.anything(),
      projectId,
      'userJoined',
      { userId: me, id: me, sessionId: 'sock-1', status: 'online' },
      'sock-1',
    );
    expect(roomMate.emit).toHaveBeenCalledWith('room:users', [{ userId: other, id: other, sessionId: 'sock-2', status: 'online' }]);
  });

  it.each(['spectator', 'none'])('keeps a %s out of the project room', async (standing) => {
    const { gateway, live } = setup({ standing });
    const s = socket();
    await gateway.joinProject({ projectId }, s as any);
    await gateway.joinRoom(`project:${projectId}`, s as any);
    expect(s.join).not.toHaveBeenCalled();
    expect(s.emit).not.toHaveBeenCalled();
    expect(live.sendToProject).not.toHaveBeenCalled();
  });

  it('ignores a malformed project ID without asking the database', async () => {
    const { gateway, live } = setup();
    for (const bad of ['not-an-id', `${projectId}0`, 12, null, { $ne: null }] as any[]) {
      const s = socket();
      await gateway.joinProject({ projectId: bad }, s as any);
      expect(s.join).not.toHaveBeenCalled();
    }
    expect(live.standingOf).not.toHaveBeenCalled();
  });

  it('only shares presence for a project room the socket is in', async () => {
    const { gateway, live } = setup();
    const outside = socket();
    await gateway.updatePresence({ projectId, isInvisible: true }, outside as any);
    expect(live.sendToProject).not.toHaveBeenCalled();

    const inside = socket();
    inside.rooms.add(`project:${projectId}`);
    await gateway.updatePresence({ projectId, isInvisible: true }, inside as any);
    expect(live.sendToProject).toHaveBeenCalledWith(expect.anything(), projectId, 'userLeft', expect.objectContaining({ userId: me }), inside.id);
    expect(live.allowedInProject).toHaveBeenCalledWith(expect.anything(), projectId);
  });

  it('leaves out invisible people from who is here', async () => {
    const visible = { id: 'sock-2', data: { userId: other }, emit: jest.fn() };
    const hidden = { id: 'sock-3', data: { userId: me, isInvisible: true }, emit: jest.fn() };
    const { gateway } = setup({ allowed: [visible, hidden] });
    await gateway.joinProject({ projectId }, socket() as any);
    expect(hidden.emit).toHaveBeenCalledWith('room:users', [{ userId: other, id: other, sessionId: 'sock-2', status: 'online' }]);
  });
});

describe('R52b main live-update channel: person and public rooms', () => {
  it('joins only your own person room', async () => {
    const { gateway } = setup();
    const asking = socket();
    await gateway.joinUser({ userId: other }, asking as any);
    expect(asking.join).not.toHaveBeenCalled();

    for (const body of [{ userId: me }, { userId: me.toUpperCase() }, {}, undefined]) {
      const s = socket();
      await gateway.joinUser(body as any, s as any);
      expect(s.join).toHaveBeenCalledWith(`user:${me}`);
      expect(s.emit).toHaveBeenCalledWith('joinedUser', { room: `user:${me}` });
    }
  });

  it('leaves only your own person room', async () => {
    const { gateway } = setup();
    const s = socket();
    s.data.userId = me;
    await gateway.leaveUser({ userId: other }, s as any);
    expect(s.leave).not.toHaveBeenCalled();
    await gateway.leaveUser({ userId: me }, s as any);
    expect(s.leave).toHaveBeenCalledWith(`user:${me}`);
  });

  it.each([['spectator', true], ['reader', true], ['writer', true], ['none', false]] as const)(
    'decides a public project room for a %s',
    async (standing, allowed) => {
      const { gateway } = setup({ standing });
      const s = socket();
      await gateway.joinRoom(`public:project:${projectId.toUpperCase()}`, s as any);
      expect(s.join.mock.calls).toEqual(allowed ? [[`public:project:${projectId}`]] : []);
    },
  );

  it('ignores any other room name', async () => {
    const { gateway, live } = setup();
    for (const room of [`user:${other}`, 'conversation:abc', `project:${projectId}:extra`, 'project:', `thread:${projectId}`, 42, null] as any[]) {
      const s = socket();
      await gateway.joinRoom(room, s as any);
      expect([room, s.join.mock.calls.length]).toEqual([room, 0]);
    }
    expect(live.signIn).not.toHaveBeenCalled();
  });
});

describe('R52b main live-update channel: sending', () => {
  it('sends project and person updates through the checked sender', () => {
    const { gateway, live } = setup();
    gateway.emitToProject(projectId, 'project:membersUpdated', { n: 1 });
    gateway.emitToUser(me, 'user:updated', { n: 2 });
    expect(live.sendToProject).toHaveBeenCalledWith(gateway.server, projectId, 'project:membersUpdated', { n: 1 });
    expect(live.sendToUser).toHaveBeenCalledWith(gateway.server, me, 'user:updated', { n: 2 });
  });

  it('tells the rooms a socket was in when it disconnects, through the checked sender', async () => {
    const { gateway, live } = setup();
    const s = socket();
    s.data.userId = me;
    s.data.projectRooms = new Set([projectId]);
    await gateway.handleDisconnect(s as any);
    expect(live.sendToProject).toHaveBeenCalledWith(gateway.server, projectId, 'userLeft', expect.objectContaining({ userId: me }));
  });
});
