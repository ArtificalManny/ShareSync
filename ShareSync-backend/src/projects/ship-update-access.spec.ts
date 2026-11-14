import { ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ProjectsService } from './projects.service';

// openshare-project-write-standing-v1 (R53)
//
// A ship update changes the project's shared metrics and notifies its people:
// the owner and members who can edit (role owner, admin or member) post them.
// Viewers, guests and spectators only read.

const ID = {
  owner: '64a000000000000000000001',
  admin: '64a000000000000000000002',
  member: '64a000000000000000000003',
  norole: '64a000000000000000000004',
  viewer: '64a000000000000000000005',
  guest: '64a000000000000000000006',
  spectator: '64a000000000000000000007',
};
const PROJECT_ID = '64a0000000000000000000aa';

function service() {
  const oid = (id: string) => new Types.ObjectId(id);
  const project = {
    _id: oid(PROJECT_ID),
    ownerId: oid(ID.owner),
    members: [
      { userId: oid(ID.admin), role: 'admin' },
      { userId: oid(ID.member), role: 'member' },
      { userId: oid(ID.norole) },
      { userId: oid(ID.viewer), role: 'viewer' },
      { userId: oid(ID.guest), role: 'guest' },
    ],
    visibility: 'public',
    status: 'active',
  };
  const s: any = Object.create(ProjectsService.prototype);
  s.findByIdWithAccess = jest.fn(async () => project);
  s.assertProjectWritableForBilling = jest.fn(async () => {
    throw new Error('REACHED_BILLING');
  });
  return s;
}

async function outcome(run: () => Promise<unknown>): Promise<string> {
  try {
    await run();
    return 'done';
  } catch (error: any) {
    if (error instanceof ForbiddenException) return `403 ${error.message}`;
    return String(error?.message || error);
  }
}

describe('posting a ship update (R53)', () => {
  it.each(['owner', 'admin', 'member', 'norole'] as const)('is open to the %s', async (who) => {
    const s = service();
    expect(await outcome(() => s.recordShipUpdate({ projectId: PROJECT_ID, userId: ID[who], shipTitle: 'v2' }))).toBe('REACHED_BILLING');
  });

  it.each(['viewer', 'guest', 'spectator'] as const)('is refused to a %s', async (who) => {
    const s = service();
    expect(await outcome(() => s.recordShipUpdate({ projectId: PROJECT_ID, userId: ID[who], shipTitle: 'v2' }))).toBe('403 You do not have permission to post updates for this project');
    expect(s.assertProjectWritableForBilling).not.toHaveBeenCalled();
  });
});
