import { ForbiddenException } from '@nestjs/common';
import { FocusController } from './focus.controller';

// openshare-project-write-standing-v1 (R53)
//
// Starting a focus session through the web route: tagging it with a project
// needs the owner or a member (any role), the same rule as the live
// connection (R52b). A session without a project is unchanged.

const USER = '64a000000000000000000003';
const PROJECT_ID = '64a0000000000000000000aa';
const user = { sub: USER, userId: USER, id: USER };

function controller(standing: string) {
  const focusService = { startSession: jest.fn(async () => ({ started: true })) };
  const live = { standingOf: jest.fn(async (projectId: string) => (/^[0-9a-f]{24}$/i.test(projectId) ? standing : 'none')) };
  return { c: new FocusController(focusService as any, live as any), focusService, live };
}

describe('starting a focus session over the web route (R53)', () => {
  it.each(['writer', 'reader'])('can be tagged with a project where the person is a %s', async (standing) => {
    const { c, focusService, live } = controller(standing);
    await expect(c.startSession({ type: 'deep' as any, duration: 25, projectId: PROJECT_ID }, user)).resolves.toEqual({ started: true });
    expect(live.standingOf).toHaveBeenCalledWith(PROJECT_ID, USER);
    expect(focusService.startSession).toHaveBeenCalledTimes(1);
  });

  it.each(['spectator', 'none'])('cannot be tagged with a project where the person is a %s', async (standing) => {
    const { c, focusService } = controller(standing);
    await expect(c.startSession({ type: 'deep' as any, duration: 25, projectId: PROJECT_ID }, user)).rejects.toBeInstanceOf(ForbiddenException);
    expect(focusService.startSession).not.toHaveBeenCalled();
  });

  it('refuses a project ID that is not text', async () => {
    const { c, focusService } = controller('writer');
    await expect(c.startSession({ type: 'deep' as any, duration: 25, projectId: { $ne: null } as any }, user)).rejects.toBeInstanceOf(ForbiddenException);
    expect(focusService.startSession).not.toHaveBeenCalled();
  });

  it('a session without a project starts as before', async () => {
    const { c, focusService, live } = controller('none');
    await expect(c.startSession({ type: 'deep' as any, duration: 25 }, user)).resolves.toEqual({ started: true });
    expect(live.standingOf).not.toHaveBeenCalled();
    expect(focusService.startSession).toHaveBeenCalledWith(USER, { type: 'deep', duration: 25 });
  });
});
