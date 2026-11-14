import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { READ_ONLY_MESSAGE } from '../common/guards/project-write-standing';
import { CalendarService } from './calendar.service';

// openshare-project-write-standing-v1 (R53)
//
// A project's schedule is shared project content: creating, editing,
// cancelling or deleting its sessions, and managing their attendees, need a
// writer (the owner, or a member whose role is owner, admin or member).
// Personal events (no project) are unchanged.

const ID = {
  owner: '64a000000000000000000001',
  admin: '64a000000000000000000002',
  member: '64a000000000000000000003',
  norole: '64a000000000000000000004',
  viewer: '64a000000000000000000005',
  guest: '64a000000000000000000006',
  outsider: '64a000000000000000000007',
};
type Who = keyof typeof ID;
const WRITERS: Who[] = ['owner', 'admin', 'member', 'norole'];
const READERS: Who[] = ['viewer', 'guest'];
const PROJECT_ID = '64a0000000000000000000aa';
const EVENT_ID = '64a000000000000000000ea1';
const oid = (id: string) => new Types.ObjectId(id);

function project() {
  return {
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
}

// The membership query the service sends finds the project only for its owner
// and members, as MongoDB would.
function projectsCollection() {
  return {
    findOne: jest.fn(async (query: any) => {
      const actor = String(query?.$or?.[0]?.owner?.$in?.[0] ?? '');
      const p = project();
      const isIn = String(p.ownerId) === actor || p.members.some((m) => String(m.userId) === actor);
      return isIn ? p : null;
    }),
  };
}

function event(createdBy: string, projectId: string | null = PROJECT_ID) {
  const e: any = {
    _id: oid(EVENT_ID),
    title: 'Planning',
    projectId: projectId ? oid(projectId) : null,
    createdBy: oid(createdBy),
    attendees: [],
    isRecurring: false,
  };
  e.save = jest.fn(async () => e);
  return e;
}

function calendar(ev: any) {
  const collection = projectsCollection();
  const projectsService = {
    assertProjectWritableForBilling: jest.fn(async () => {
      throw new Error('REACHED_BILLING');
    }),
    assertProjectMemberActiveForBilling: jest.fn(async () => undefined),
  };
  const s: any = Object.assign(Object.create(CalendarService.prototype), {
    eventModel: {
      db: { collection: () => collection },
      findById: jest.fn(() => ({ lean: async () => ev })),
    },
    projectsService,
    textModerationService: {},
    eventEmitter: { emit: jest.fn() },
  });
  jest.spyOn(s, 'findById').mockResolvedValue(ev);
  jest.spyOn(s, 'assertScheduleTextAllowed').mockImplementation(async () => {
    throw new Error('REACHED_TEXT_CHECK');
  });
  return { s, projectsService };
}

async function outcome(run: () => Promise<unknown>): Promise<string> {
  try {
    await run();
    return 'done';
  } catch (error: any) {
    if (error instanceof ForbiddenException) return `403 ${error.message}`;
    if (error instanceof BadRequestException) return `400 ${error.message}`;
    return String(error?.message || error);
  }
}

const start = new Date('2026-12-01T10:00:00Z').toISOString();
const end = new Date('2026-12-01T11:00:00Z').toISOString();

describe.each([
  ['adding a session to the project schedule', (s: any, u: string) => s.create(u, { projectId: PROJECT_ID, title: 'Sync', startTime: start, endTime: end })],
  ['editing a session', (s: any, u: string) => s.update(EVENT_ID, u, { title: 'Moved' })],
  ['deleting a session', (s: any, u: string) => s.delete(EVENT_ID, u)],
  ['cancelling a session they created', (s: any, u: string) => s.cancel(EVENT_ID, u)],
  ['adding someone to a session', (s: any, u: string) => s.addAttendee(EVENT_ID, u, ID.member)],
])('%s (R53)', (_name, run) => {
  it.each(WRITERS)('is open to the %s', async (who) => {
    const { s } = calendar(event(ID[who]));
    expect(await outcome(() => run(s, ID[who]))).toBe('REACHED_BILLING');
  });

  it.each(READERS)('is read-only for a %s, even for a session they created', async (who) => {
    const ev = event(ID[who]);
    const { s, projectsService } = calendar(ev);
    expect(await outcome(() => run(s, ID[who]))).toBe(`403 ${READ_ONLY_MESSAGE}`);
    expect(projectsService.assertProjectWritableForBilling).not.toHaveBeenCalled();
    expect(ev.save).not.toHaveBeenCalled();
  });

  it('is refused to someone outside the project, as before', async () => {
    const { s } = calendar(event(ID.outsider));
    expect(await outcome(() => run(s, ID.outsider))).toBe('400 Only a current project member can modify project schedule sessions');
  });
});

describe('personal events (R53: unchanged)', () => {
  it.each([...READERS, 'outsider'] as Who[])('a %s can still add one of their own', async (who) => {
    const { s } = calendar(event(ID[who], null));
    expect(await outcome(() => s.create(ID[who], { title: 'Dentist', startTime: start, endTime: end }))).toBe('REACHED_TEXT_CHECK');
  });
});
