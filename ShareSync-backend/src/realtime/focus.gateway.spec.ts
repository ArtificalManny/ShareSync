import { FocusGateway } from './focus.gateway';

// openshare-live-access-v1 (R52b)

const projectId = '507f1f77bcf86cd799439011';
const me = '507f191e810c19729de860ea';

function setup(standing = 'writer') {
  const focusService = {
    startSession: jest.fn(async (_userId: string, data: any) => ({ _id: 'session-1', projectId: data?.projectId, xpEarned: 0 })),
    completeSession: jest.fn(async () => ({ _id: 'session-1', projectId, xpEarned: 12 })),
  };
  const live = {
    standingOf: jest.fn(async (_projectId: string, _userId: string) => standing),
    sendToProject: jest.fn(async () => undefined),
  };
  const gateway = new FocusGateway(focusService as any, live as any);
  gateway.server = {} as any;
  const client = { user: { id: me }, emit: jest.fn() };
  return { gateway, focusService, live, client };
}

describe('R52b focus sessions', () => {
  it.each(['none', 'spectator'])('refuses to tag a session with a project where the user is a %s', async (standing) => {
    const { gateway, focusService, live, client } = setup(standing);
    const result = await gateway.handleStart(client as any, { projectId, type: 'deep_work', duration: 25 });
    expect(result).toEqual({ success: false, error: 'Not authorized for this project' });
    expect(client.emit).toHaveBeenCalledWith('focus:error', { message: 'Not authorized for this project' });
    expect(focusService.startSession).not.toHaveBeenCalled();
    expect(live.sendToProject).not.toHaveBeenCalled();
  });

  it('refuses a project ID that is not text', async () => {
    const { gateway, focusService, live } = setup('none');
    for (const bad of [{ $ne: null }, 12, [projectId]]) {
      const client = { user: { id: me }, emit: jest.fn() };
      await gateway.handleStart(client as any, { projectId: bad, type: 'deep_work', duration: 25 });
      expect(client.emit).toHaveBeenCalledWith('focus:error', { message: 'Not authorized for this project' });
    }
    expect(live.standingOf.mock.calls.every(([id]) => id === '')).toBe(true);
    expect(focusService.startSession).not.toHaveBeenCalled();
  });

  it.each(['writer', 'reader'])('starts a %s\'s session and announces it to the project', async (standing) => {
    const { gateway, focusService, live, client } = setup(standing);
    await gateway.handleStart(client as any, { projectId, type: 'deep_work', duration: 25 });
    expect(live.standingOf).toHaveBeenCalledWith(projectId, me);
    expect(focusService.startSession).toHaveBeenCalled();
    expect(live.sendToProject).toHaveBeenCalledWith(gateway.server, projectId, 'focus:user-started', { userId: me, sessionId: 'session-1' });
  });

  it('starts a session without a project with no announcement', async () => {
    const { gateway, focusService, live, client } = setup('none');
    await gateway.handleStart(client as any, { type: 'deep_work', duration: 25 });
    expect(live.standingOf).not.toHaveBeenCalled();
    expect(focusService.startSession).toHaveBeenCalled();
    expect(live.sendToProject).not.toHaveBeenCalled();
  });

  it('announces a completed session through the checked sender', async () => {
    const { gateway, live, client } = setup();
    await gateway.handleComplete(client as any, { sessionId: 'session-1' });
    expect(live.sendToProject).toHaveBeenCalledWith(gateway.server, projectId, 'focus:user-completed', { userId: me, sessionId: 'session-1', xpEarned: 12 });
    gateway.broadcastToProject(projectId, 'focus:custom', { a: 1 });
    expect(live.sendToProject).toHaveBeenCalledWith(gateway.server, projectId, 'focus:custom', { a: 1 });
  });
});
