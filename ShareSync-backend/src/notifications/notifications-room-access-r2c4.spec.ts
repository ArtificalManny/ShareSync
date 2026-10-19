import { readFileSync } from 'fs';
import { join } from 'path';
import { NotificationsGateway } from './notifications.gateway';

describe('V2G1-R2C4 notification project-room authorization', () => {
  const projectId = '507f1f77bcf86cd799439011';
  const userId = '507f191e810c19729de860ea';
  const otherId = '507f1f77bcf86cd799439012';

  let project: any;
  let dbFails: boolean;

  const projectModel = {
    findById: jest.fn((_id: string) => ({
      lean: jest.fn(async () => {
        if (dbFails) throw new Error('Database unavailable');
        return project;
      }),
    })),
  };

  function gateway(): NotificationsGateway {
    const instance = Object.create(
      NotificationsGateway.prototype,
    ) as NotificationsGateway;

    Object.assign(instance, {
      projectModel,
      logger: {
        log: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      },
    });

    return instance;
  }

  function client(authenticated = true): any {
    return {
      userId: authenticated ? userId : undefined,
      join: jest.fn().mockResolvedValue(undefined),
      leave: jest.fn(),
    };
  }

  beforeEach(() => {
    dbFails = false;
    project = {
      _id: projectId,
      ownerId: otherId,
      visibility: 'private',
      members: [],
    };

    jest.clearAllMocks();
  });

  it.each([
    'ownerId',
    'owner',
    'createdBy',
    'createdById',
  ])('allows private project owner alias %s', async (field) => {
    project[field] = userId;

    const socket = client();
    await gateway().handleProjectJoin(
      socket,
      { projectId },
    );

    expect(socket.join).toHaveBeenCalledWith(
      `project:${projectId}`,
    );
  });

  it.each([
    'userId',
    'memberId',
    'user',
  ])('allows private project member alias %s', async (field) => {
    project.members = [{ [field]: userId }];

    const socket = client();
    await gateway().handleProjectJoin(
      socket,
      { projectId },
    );

    expect(socket.join).toHaveBeenCalledWith(
      `project:${projectId}`,
    );
  });

  it('denies a nonmember of a private project', async () => {
    const socket = client();

    await gateway().handleProjectJoin(socket, { projectId });

    expect(socket.join).not.toHaveBeenCalled();
  });

  it('denies private joins without an authenticated user', async () => {
    project.ownerId = userId;
    const socket = client(false);

    await gateway().handleProjectJoin(socket, { projectId });

    expect(socket.join).not.toHaveBeenCalled();
    expect(projectModel.findById).not.toHaveBeenCalled();
  });

  it('denies malformed private project identifiers', async () => {
    const socket = client();

    await gateway().handleProjectJoin(socket, {
      projectId: 'invalid-id',
    });

    expect(socket.join).not.toHaveBeenCalled();
    expect(projectModel.findById).not.toHaveBeenCalled();
  });

  it('denies nonexistent private projects', async () => {
    project = null;
    const socket = client();

    await gateway().handleProjectJoin(socket, { projectId });

    expect(socket.join).not.toHaveBeenCalled();
  });

  it('denies private joins during database failure', async () => {
    dbFails = true;
    const socket = client();

    await gateway().handleProjectJoin(socket, { projectId });

    expect(socket.join).not.toHaveBeenCalled();
  });

  it('allows a public project spectator subscription', async () => {
    project.visibility = 'public';
    const socket = client();

    await gateway().handlePublicProjectJoin(
      socket,
      { projectId },
    );

    expect(socket.join).toHaveBeenCalledWith(
      `public:project:${projectId}`,
    );
  });

  it.each([
    'private',
    'team',
  ])('denies spectator joins for %s projects', async (visibility) => {
    project.visibility = visibility;
    const socket = client();

    await gateway().handlePublicProjectJoin(
      socket,
      { projectId },
    );

    expect(socket.join).not.toHaveBeenCalled();
  });

  it('denies spectator joins without visibility', async () => {
    delete project.visibility;
    const socket = client();

    await gateway().handlePublicProjectJoin(
      socket,
      { projectId },
    );

    expect(socket.join).not.toHaveBeenCalled();
  });

  it('denies spectator joins for nonexistent projects', async () => {
    project = null;
    const socket = client();

    await gateway().handlePublicProjectJoin(
      socket,
      { projectId },
    );

    expect(socket.join).not.toHaveBeenCalled();
  });

  it('denies malformed spectator project identifiers', async () => {
    const socket = client();

    await gateway().handlePublicProjectJoin(
      socket,
      { projectId: 'invalid-id' },
    );

    expect(socket.join).not.toHaveBeenCalled();
    expect(projectModel.findById).not.toHaveBeenCalled();
  });

  it('denies spectator joins on database failure', async () => {
    dbFails = true;
    const socket = client();

    await gateway().handlePublicProjectJoin(
      socket,
      { projectId },
    );

    expect(socket.join).not.toHaveBeenCalled();
  });

  it('denies spectator joins without a validated user', async () => {
    project.visibility = 'public';
    const socket = client(false);

    await gateway().handlePublicProjectJoin(
      socket,
      { projectId },
    );

    expect(socket.join).not.toHaveBeenCalled();
    expect(projectModel.findById).not.toHaveBeenCalled();
  });

  it('preserves all four existing socket event names', () => {
    const source = readFileSync(
      join(__dirname, 'notifications.gateway.ts'),
      'utf8',
    );

    for (const event of [
      'project:join',
      'project:leave',
      'public:project:join',
      'public:project:leave',
    ]) {
      expect(source).toContain(
        `@SubscribeMessage('${event}')`,
      );
    }
  });
});
