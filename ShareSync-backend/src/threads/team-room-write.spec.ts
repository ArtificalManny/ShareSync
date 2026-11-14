import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { READ_ONLY_MESSAGE } from '../common/guards/project-write-standing';
import { ThreadsService } from './threads.service';
import { ThreadMessagesService } from '../thread-messages/thread-messages.service';

// openshare-project-write-standing-v1 (R53)
//
// Team Room: every project participant reads it. Starting, changing, pinning
// or deleting a thread and posting or editing a message need a writer (the
// owner, or a member whose role is owner, admin or member). Reacting, muting
// or archiving for yourself and deleting your own messages are unchanged.

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
const THREAD_ID = '64a0000000000000000000cc';
const MESSAGE_ID = '64a0000000000000000000dd';

function project() {
  return {
    _id: new Types.ObjectId(PROJECT_ID),
    ownerId: new Types.ObjectId(ID.owner),
    members: [
      { userId: new Types.ObjectId(ID.admin), role: 'admin' },
      { userId: new Types.ObjectId(ID.member), role: 'member' },
      { userId: new Types.ObjectId(ID.norole) },
      { userId: new Types.ObjectId(ID.viewer), role: 'viewer' },
      { userId: new Types.ObjectId(ID.guest), role: 'guest' },
    ],
    visibility: 'public',
    status: 'active',
  };
}

function threadDoc(createdBy: string) {
  return {
    _id: new Types.ObjectId(THREAD_ID),
    projectId: new Types.ObjectId(PROJECT_ID),
    createdBy: new Types.ObjectId(createdBy),
    title: 'Launch',
    save: jest.fn(async function (this: any) { return this; }),
  };
}

function db(threads: Record<string, unknown> = {}) {
  return {
    collection: (name: string) => ({
      findOne: jest.fn(async () => (name === 'projects' ? project() : name === 'threads' ? threads : null)),
    }),
  };
}

function projectsService(memberBilling: 'reached' | 'passes' = 'reached') {
  return {
    assertProjectMemberActiveForBilling: jest.fn(async () => {
      if (memberBilling === 'reached') throw new Error('REACHED_MEMBER_BILLING');
    }),
    assertProjectWritableForBilling: jest.fn(async () => {
      throw new Error('REACHED_BILLING');
    }),
  };
}

function make<T>(cls: new (...args: any[]) => T, fields: Record<string, unknown>): T {
  return Object.assign(Object.create(cls.prototype), fields);
}

async function outcome(run: () => Promise<unknown>): Promise<string> {
  try {
    await run();
    return 'done';
  } catch (error: any) {
    if (error instanceof ForbiddenException) return `403 ${error.message}`;
    if (error instanceof BadRequestException) return `400 ${error.message}`;
    if (error instanceof NotFoundException) return `404 ${error.message}`;
    return String(error?.message || error);
  }
}

function threads(createdBy = ID.member, memberBilling: 'reached' | 'passes' = 'reached') {
  const projects = projectsService(memberBilling);
  const s: any = make(ThreadsService, {
    threadModel: { db: db() },
    projectsService: projects,
  });
  jest.spyOn(s, 'findById').mockResolvedValue(threadDoc(createdBy));
  return { s, projects };
}

describe('Team Room threads (R53)', () => {
  describe.each([
    ['starting a thread', (s: any, u: string) => s.create(u, { projectId: PROJECT_ID, title: 'Hi' })],
    ['renaming a thread', (s: any, u: string) => s.update(THREAD_ID, u, { title: 'Renamed' })],
    ['pinning a thread', (s: any, u: string) => s.update(THREAD_ID, u, { isPinned: true })],
    ['deleting a thread', (s: any, u: string) => s.delete(THREAD_ID, u)],
  ])('%s', (_name, run) => {
    it.each(WRITERS)('is open to the %s', async (who) => {
      // The thread is theirs, so only the write rule is being tested.
      const { s } = threads(ID[who]);
      expect(await outcome(() => run(s, ID[who]))).toBe('REACHED_MEMBER_BILLING');
    });

    it.each(READERS)('is read-only for a %s, even for a thread they started', async (who) => {
      const { s, projects } = threads(ID[who]);
      expect(await outcome(() => run(s, ID[who]))).toBe(`403 ${READ_ONLY_MESSAGE}`);
      expect(projects.assertProjectMemberActiveForBilling).not.toHaveBeenCalled();
      expect(projects.assertProjectWritableForBilling).not.toHaveBeenCalled();
    });

    it('is refused to someone outside the project', async () => {
      const { s } = threads(ID.outsider);
      expect(await outcome(() => run(s, ID.outsider))).toBe('403 You do not have access to this project');
    });
  });

  describe('opening the Team Room of a project with no threads yet', () => {
    function emptyRoom(memberBilling: 'passes') {
      const projects = projectsService(memberBilling);
      const find = { populate: () => find, sort: () => find, exec: async () => [] };
      const s: any = make(ThreadsService, {
        threadModel: { db: db(), find: jest.fn(() => find), countDocuments: jest.fn(async () => 0) },
        projectsService: projects,
      });
      const create = jest.spyOn(s, 'create').mockResolvedValue({ _id: new Types.ObjectId(THREAD_ID) });
      jest.spyOn(s, 'findById').mockResolvedValue(threadDoc(ID.member));
      return { s, create };
    }

    it.each(READERS)('the %s sees no threads and starts none', async (who) => {
      const { s, create } = emptyRoom('passes');
      expect(await s.findByProject(PROJECT_ID, {}, ID[who])).toEqual([]);
      expect(create).not.toHaveBeenCalled();
    });

    it.each(WRITERS)('a visit by the %s starts the General thread', async (who) => {
      const { s, create } = emptyRoom('passes');
      const found = await s.findByProject(PROJECT_ID, {}, ID[who]);
      expect(create).toHaveBeenCalledTimes(1);
      expect(create.mock.calls[0][0]).toBe(ID[who]);
      expect(found).toHaveLength(1);
    });
  });
});

function messages(memberBilling: 'reached' | 'passes' = 'reached', authorId = ID.member) {
  const projects = projectsService(memberBilling);
  const s: any = make(ThreadMessagesService, {
    messageModel: { db: db({ _id: new Types.ObjectId(THREAD_ID), projectId: new Types.ObjectId(PROJECT_ID) }) },
    projectsService: projects,
  });
  const msg: any = {
    _id: new Types.ObjectId(MESSAGE_ID),
    threadId: new Types.ObjectId(THREAD_ID),
    userId: new Types.ObjectId(authorId),
    content: 'hello',
    reactions: [],
  };
  msg.save = jest.fn(async () => msg);
  jest.spyOn(s, 'findById').mockResolvedValue(msg);
  return { s, projects, msg };
}

describe('Team Room messages (R53)', () => {
  describe.each([
    ['posting a message', (s: any, u: string) => s.create(THREAD_ID, u, { content: 'Hi' })],
    ['editing your own message', (s: any, u: string) => s.edit(MESSAGE_ID, u, 'Edited')],
  ])('%s', (_name, run) => {
    it.each(WRITERS)('is open to the %s', async (who) => {
      const { s } = messages('reached', ID[who]);
      expect(await outcome(() => run(s, ID[who]))).toBe('REACHED_MEMBER_BILLING');
    });

    it.each(READERS)('is read-only for a %s', async (who) => {
      const { s, projects, msg } = messages('reached', ID[who]);
      expect(await outcome(() => run(s, ID[who]))).toBe(`403 ${READ_ONLY_MESSAGE}`);
      expect(projects.assertProjectMemberActiveForBilling).not.toHaveBeenCalled();
      expect(msg.save).not.toHaveBeenCalled();
      expect(msg.content).toBe('hello');
    });

    it('is refused to someone outside the project', async () => {
      const { s } = messages('reached', ID.outsider);
      expect(await outcome(() => run(s, ID.outsider))).toBe('403 You do not have access to this project');
    });
  });

  it.each(READERS)('the %s can still react to a message', async (who) => {
    const { s, msg } = messages('passes');
    s.projectsService.assertProjectWritableForBilling = jest.fn(async () => undefined);
    await s.addReaction(MESSAGE_ID, ID[who], '👍');
    expect(msg.save).toHaveBeenCalledTimes(1);
    expect(msg.reactions[0].users.map(String)).toEqual([ID[who]]);
  });
});
