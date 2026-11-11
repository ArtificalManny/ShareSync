import { Types } from 'mongoose';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { RealtimeService } from './realtime.service';

// openshare-live-access-v1 (R52b): every live send goes through LiveAccessService.

const projectId = '507f1f77bcf86cd799439011';
const me = '507f191e810c19729de860ea';

function liveMock() {
  return {
    sendToProject: jest.fn(async () => undefined),
    sendToPublicProject: jest.fn(async () => undefined),
    sendToUser: jest.fn(async () => undefined),
  };
}

describe('R52b realtime service', () => {
  it('sends project, person and public updates through the checked sender', () => {
    const live = liveMock();
    const service = new RealtimeService(live as any);
    const server = {} as any;
    service.setServer(server);
    service.projectEmit(projectId, 'taskUpdated', { a: 1 });
    service.userEmit(me, 'user:updated', { b: 2 });
    service.roomEmit(`public:project:${projectId}`, 'public:project:update', { c: 3 });
    service.roomEmit(`project:${projectId}`, 'taskUpdated', { d: 4 });
    service.roomEmit(`user:${me}`, 'user:updated', { e: 5 });
    service.emitToProjectRoom(projectId, 'x', 1);
    service.emitToUserRoom(me, 'y', 2);
    expect(live.sendToProject.mock.calls).toEqual([
      [server, projectId, 'taskUpdated', { a: 1 }],
      [server, projectId, 'taskUpdated', { d: 4 }],
      [server, projectId, 'x', 1],
    ]);
    expect(live.sendToUser.mock.calls).toEqual([
      [server, me, 'user:updated', { b: 2 }],
      [server, me, 'user:updated', { e: 5 }],
      [server, me, 'y', 2],
    ]);
    expect(live.sendToPublicProject.mock.calls).toEqual([[server, projectId, 'public:project:update', { c: 3 }]]);
  });

  it('ignores any other room and sends nothing before the server is attached', () => {
    const live = liveMock();
    const service = new RealtimeService(live as any);
    service.projectEmit(projectId, 'taskUpdated', {});
    service.setServer({} as any);
    for (const room of ['everyone', projectId, `thread:${projectId}`, `conversation:${projectId}`, `project:${projectId}:x`, '']) {
      service.roomEmit(room, 'e', {});
    }
    expect(live.sendToProject).not.toHaveBeenCalled();
    expect(live.sendToUser).not.toHaveBeenCalled();
    expect(live.sendToPublicProject).not.toHaveBeenCalled();
  });
});

describe('R52b notifications channel', () => {
  function gateway(userTokenVersion = 2) {
    const live = liveMock();
    const connection = {
      models: {
        User: {
          findById: jest.fn(() => ({
            select: () => ({ lean: () => ({ exec: async () => ({ _id: new Types.ObjectId(me), tokenVersion: userTokenVersion }) }) }),
          })),
        },
      },
    };
    const jwt = { verify: jest.fn(() => ({ sub: me, tokenVersion: 2 })) };
    const g = new NotificationsGateway(jwt as any, connection as any, {} as any, live as any);
    g.server = {} as any;
    return { g, live };
  }

  it('remembers who a signed-in socket is, for the checks at send time', async () => {
    const { g } = gateway();
    const client: any = { id: 's1', handshake: { auth: { token: 'good-token' }, headers: {} }, data: {}, join: jest.fn(), disconnect: jest.fn() };
    await g.handleConnection(client);
    expect(client.disconnect).not.toHaveBeenCalled();
    expect(client.data).toEqual(expect.objectContaining({ userId: me, tokenVersion: 2 }));
    expect(client.join).toHaveBeenCalledWith(`user:${me}`);
  });

  it('still closes a socket whose session was revoked', async () => {
    const { g } = gateway(3);
    const client: any = { id: 's1', handshake: { auth: { token: 'good-token' }, headers: {} }, data: {}, join: jest.fn(), disconnect: jest.fn() };
    await g.handleConnection(client);
    expect(client.disconnect).toHaveBeenCalled();
    expect(client.join).not.toHaveBeenCalled();
  });

  it('sends every notification event through the checked sender', () => {
    const { g, live } = gateway();
    g.handleNotificationCreated({ userId: new Types.ObjectId(me), _id: 'n1', type: 't', title: 'secret' } as any);
    g.handleNotificationRead({ userId: me, notificationId: 'n1' });
    g.handleNotificationReadAll({ userId: me, markedCount: 2 });
    g.handleNotificationDeleted({ userId: me, notificationId: 'n1' });
    g.handleNotificationCount({ userId: me, unread: 4 });
    g.sendToUser(me, 'custom', 1);
    g.sendToProject(projectId, 'custom', 2);
    g.sendToPublicProject(projectId, 'custom', 3);
    expect(live.sendToUser.mock.calls.map((c: any[]) => [c[1], c[2]])).toEqual([
      [me, 'notification:new'],
      [me, 'notification:read'],
      [me, 'notification:read'],
      [me, 'notification:deleted'],
      [me, 'notification:count'],
      [me, 'custom'],
    ]);
    expect(live.sendToProject.mock.calls.map((c: any[]) => [c[1], c[2]])).toEqual([[projectId, 'custom']]);
    expect(live.sendToPublicProject.mock.calls.map((c: any[]) => [c[1], c[2]])).toEqual([[projectId, 'custom']]);
  });
});
