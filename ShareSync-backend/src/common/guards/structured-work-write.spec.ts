import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { MEMBERS_ONLY_MESSAGE, READ_ONLY_MESSAGE } from './project-write-standing';
import { DecisionsService } from '../../decisions/decisions.service';
import { CommitmentsService } from '../../commitments/commitments.service';
import { ApprovalsService } from '../../approvals/approvals.service';
import { HandoffsService } from '../../handoffs/handoffs.service';
import { AsyncCheckInsService } from '../../async-check-ins/async-check-ins.service';
import { ResponsibilityMapService } from '../../responsibility-map/responsibility-map.service';
import { ApprovalStatus } from '../../approvals/schemas/approval.schema';
import { HandoffStatus } from '../../handoffs/schemas/handoff.schema';
import { AsyncCheckInStatus } from '../../async-check-ins/schemas/async-check-in.schema';

// openshare-project-write-standing-v1 (R53)
//
// Decisions, commitments, approvals, handoffs, check-ins and the responsibility
// map: creating or changing them needs a writer (the owner, or a member whose
// role is owner, admin or member). Viewers, guests and spectators only read.
// Answering something addressed to you still works for any current member.

const ID = {
  owner: '64a000000000000000000001',
  admin: '64a000000000000000000002',
  member: '64a000000000000000000003',
  norole: '64a000000000000000000004',
  viewer: '64a000000000000000000005',
  guest: '64a000000000000000000006',
  spectator: '64a000000000000000000007',
};
type Who = keyof typeof ID;
const WRITERS: Who[] = ['owner', 'admin', 'member', 'norole'];
const READERS: Who[] = ['viewer', 'guest'];
const PROJECT_ID = '64a0000000000000000000aa';
const RECORD_ID = '64a0000000000000000000bb';

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
    // Public, so the ordinary access check lets a spectator through, as the
    // real findByIdWithAccess() does. The write rule must still stop them.
    visibility: 'public',
    status: 'active',
  };
}

function projectsService(billing: 'reached' | 'passes' = 'reached') {
  return {
    findByIdWithAccess: jest.fn(async () => project()),
    assertProjectWritableForBilling: jest.fn(async () => {
      if (billing === 'reached') throw new Error('REACHED_BILLING');
    }),
    assertProjectMemberActiveForBilling: jest.fn(async () => undefined),
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
    return String(error?.message || error);
  }
}

type Case = {
  name: string;
  build: (projects: any) => any;
  run: (service: any, userId: string) => Promise<unknown>;
  allowed: string;
};

const notifications = { notify: jest.fn(async () => ({})) };

const CASES: Case[] = [
  {
    name: 'creating a decision',
    build: (projects) => make(DecisionsService, { projectsService: projects, notifications }),
    run: (s, u) => s.create(PROJECT_ID, u, { title: 'x' }),
    allowed: 'REACHED_BILLING',
  },
  {
    name: 'changing a decision',
    build: (projects) => make(DecisionsService, { projectsService: projects, notifications }),
    run: (s, u) => s.update(PROJECT_ID, RECORD_ID, u, { title: 'x' }),
    allowed: 'REACHED_BILLING',
  },
  {
    name: 'creating a commitment',
    build: (projects) => make(CommitmentsService, { projectsService: projects, notifications }),
    run: (s, u) => s.create(PROJECT_ID, u, { title: 'x' }),
    allowed: 'REACHED_BILLING',
  },
  {
    name: 'changing a commitment',
    build: (projects) => make(CommitmentsService, { projectsService: projects, notifications }),
    run: (s, u) => s.update(PROJECT_ID, RECORD_ID, u, { title: 'x' }),
    allowed: 'REACHED_BILLING',
  },
  {
    name: 'requesting an approval',
    build: (projects) => make(ApprovalsService, { projectsService: projects, notifications }),
    run: (s, u) => s.create(PROJECT_ID, u, {}),
    allowed: '400 Approval title is required',
  },
  {
    name: 'creating a handoff',
    build: (projects) => make(HandoffsService, { projectsService: projects, notifications }),
    run: (s, u) => s.create(PROJECT_ID, u, {}),
    allowed: 'REACHED_BILLING',
  },
  {
    name: 'creating a check-in',
    build: (projects) => make(AsyncCheckInsService, { projectsService: projects, notifications }),
    run: (s, u) => s.create(PROJECT_ID, u, {}),
    allowed: '400 Check-in title is required',
  },
  {
    name: 'changing a check-in',
    build: (projects) => {
      const s: any = make(AsyncCheckInsService, { projectsService: projects, notifications });
      s.findCheckInRecord = jest.fn(async () => {
        throw new Error('REACHED_RECORD');
      });
      return s;
    },
    run: (s, u) => s.update(PROJECT_ID, RECORD_ID, u, {}),
    allowed: 'REACHED_RECORD',
  },
  {
    name: 'adding a responsibility',
    build: (projects) => make(ResponsibilityMapService, { projectsService: projects, notifications }),
    run: (s, u) => s.create(PROJECT_ID, u, {}),
    allowed: 'REACHED_BILLING',
  },
  {
    name: 'changing a responsibility',
    build: (projects) => make(ResponsibilityMapService, { projectsService: projects, notifications }),
    run: (s, u) => s.update(PROJECT_ID, RECORD_ID, u, {}),
    allowed: 'REACHED_BILLING',
  },
];

describe.each(CASES)('$name (R53)', ({ build, run, allowed }) => {
  it.each(WRITERS)('is open to the %s', async (who) => {
    const projects = projectsService();
    expect(await outcome(() => run(build(projects), ID[who]))).toBe(allowed);
  });

  it.each(READERS)('is read-only for a %s, refused before anything else runs', async (who) => {
    const projects = projectsService();
    expect(await outcome(() => run(build(projects), ID[who]))).toBe(`403 ${READ_ONLY_MESSAGE}`);
    expect(projects.assertProjectWritableForBilling).not.toHaveBeenCalled();
  });

  it('is refused to a spectator of a public project', async () => {
    const projects = projectsService();
    const result = await outcome(() => run(build(projects), ID.spectator));
    expect(result.startsWith('403 ')).toBe(true);
    expect(projects.assertProjectWritableForBilling).not.toHaveBeenCalled();
  });
});

// ─── Answering an approval ───────────────────────────────────────────────────

function approvalItem(over: Record<string, unknown> = {}) {
  const item: any = {
    _id: new Types.ObjectId(RECORD_ID),
    projectId: new Types.ObjectId(PROJECT_ID),
    title: 'Sign-off',
    status: ApprovalStatus.PENDING,
    requestedBy: new Types.ObjectId(ID.member),
    approverId: new Types.ObjectId(ID.viewer),
    sourceMoveId: null,
    ...over,
  };
  item.save = jest.fn(async () => item);
  return item;
}

function approvals(item: any) {
  const approvalModel = { findOne: jest.fn(() => ({ exec: async () => item })) };
  const s: any = make(ApprovalsService, { projectsService: projectsService('passes'), notifications, approvalModel });
  jest.spyOn(s, 'notifySafely').mockResolvedValue(undefined);
  return { s, approvalModel };
}

describe('answering an approval (R53)', () => {
  it('a viewer asked to approve can approve', async () => {
    const item = approvalItem();
    const { s } = approvals(item);
    expect(await outcome(() => s.update(PROJECT_ID, RECORD_ID, ID.viewer, { status: ApprovalStatus.APPROVED }))).toBe('done');
    expect(item.status).toBe(ApprovalStatus.APPROVED);
    expect(item.save).toHaveBeenCalledTimes(1);
  });

  it('a guest asked to approve can reject', async () => {
    const item = approvalItem({ approverId: new Types.ObjectId(ID.guest) });
    const { s } = approvals(item);
    expect(await outcome(() => s.update(PROJECT_ID, RECORD_ID, ID.guest, { status: ApprovalStatus.REJECTED }))).toBe('done');
    expect(item.status).toBe(ApprovalStatus.REJECTED);
  });

  it('a requester who is now a viewer can still cancel their request', async () => {
    const item = approvalItem({ requestedBy: new Types.ObjectId(ID.viewer), approverId: new Types.ObjectId(ID.member) });
    const { s } = approvals(item);
    expect(await outcome(() => s.update(PROJECT_ID, RECORD_ID, ID.viewer, { status: ApprovalStatus.CANCELLED }))).toBe('done');
    expect(item.status).toBe(ApprovalStatus.CANCELLED);
  });

  it('an approver no longer in the project is refused before the approval is even loaded', async () => {
    const item = approvalItem({ approverId: new Types.ObjectId(ID.spectator) });
    const { s, approvalModel } = approvals(item);
    expect(await outcome(() => s.update(PROJECT_ID, RECORD_ID, ID.spectator, { status: ApprovalStatus.APPROVED }))).toBe(`403 ${MEMBERS_ONLY_MESSAGE}`);
    expect(approvalModel.findOne).not.toHaveBeenCalled();
    expect(item.save).not.toHaveBeenCalled();
    expect(item.status).toBe(ApprovalStatus.PENDING);
  });

  it('a requester no longer in the project cannot cancel', async () => {
    const item = approvalItem({ requestedBy: new Types.ObjectId(ID.spectator) });
    const { s } = approvals(item);
    expect(await outcome(() => s.update(PROJECT_ID, RECORD_ID, ID.spectator, { status: ApprovalStatus.CANCELLED }))).toBe(`403 ${MEMBERS_ONLY_MESSAGE}`);
    expect(item.save).not.toHaveBeenCalled();
  });

  it('still only the selected approver decides', async () => {
    const item = approvalItem();
    const { s } = approvals(item);
    expect(await outcome(() => s.update(PROJECT_ID, RECORD_ID, ID.admin, { status: ApprovalStatus.APPROVED }))).toBe('403 Only the selected approver can approve or reject this request');
    expect(item.save).not.toHaveBeenCalled();
  });
});

// ─── Answering a handoff ─────────────────────────────────────────────────────

function handoffItem(over: Record<string, unknown> = {}) {
  const item: any = {
    _id: new Types.ObjectId(RECORD_ID),
    projectId: new Types.ObjectId(PROJECT_ID),
    title: 'Take this over',
    status: HandoffStatus.PENDING,
    requestedBy: new Types.ObjectId(ID.member),
    recipientId: new Types.ObjectId(ID.viewer),
    sourceMoveId: null,
    ...over,
  };
  item.save = jest.fn(async () => item);
  return item;
}

function handoffs(item: any) {
  const handoffModel = { findOne: jest.fn(() => ({ exec: async () => item })) };
  const projects = projectsService('passes');
  const s: any = make(HandoffsService, { projectsService: projects, notifications, handoffModel, tasksService: {} });
  jest.spyOn(s, 'notifySafely').mockResolvedValue(undefined);
  return { s, handoffModel, projects };
}

describe('answering a handoff (R53)', () => {
  it('a viewer it was sent to can decline it', async () => {
    const item = handoffItem();
    const { s } = handoffs(item);
    expect(await outcome(() => s.update(PROJECT_ID, RECORD_ID, ID.viewer, { status: HandoffStatus.DECLINED }))).toBe('done');
    expect(item.status).toBe(HandoffStatus.DECLINED);
  });

  it('a viewer it was sent to cannot accept it: accepting takes over the work', async () => {
    const item = handoffItem();
    const { s } = handoffs(item);
    expect(await outcome(() => s.update(PROJECT_ID, RECORD_ID, ID.viewer, { status: HandoffStatus.ACCEPTED }))).toBe(`403 ${READ_ONLY_MESSAGE}`);
    expect(item.save).not.toHaveBeenCalled();
    expect(item.status).toBe(HandoffStatus.PENDING);
  });

  it.each(['admin', 'norole'] as const)('a %s it was sent to can accept it', async (who) => {
    const item = handoffItem({ recipientId: new Types.ObjectId(ID[who]) });
    const { s } = handoffs(item);
    expect(await outcome(() => s.update(PROJECT_ID, RECORD_ID, ID[who], { status: HandoffStatus.ACCEPTED }))).toBe('done');
    expect(item.status).toBe(HandoffStatus.ACCEPTED);
  });

  it('a requester who is now a viewer can still cancel it', async () => {
    const item = handoffItem({ requestedBy: new Types.ObjectId(ID.viewer), recipientId: new Types.ObjectId(ID.member) });
    const { s } = handoffs(item);
    expect(await outcome(() => s.update(PROJECT_ID, RECORD_ID, ID.viewer, { status: HandoffStatus.CANCELLED }))).toBe('done');
    expect(item.status).toBe(HandoffStatus.CANCELLED);
  });

  it('a recipient no longer in the project is refused before anything else runs', async () => {
    const item = handoffItem({ recipientId: new Types.ObjectId(ID.spectator) });
    const { s, handoffModel, projects } = handoffs(item);
    expect(await outcome(() => s.update(PROJECT_ID, RECORD_ID, ID.spectator, { status: HandoffStatus.DECLINED }))).toBe(`403 ${MEMBERS_ONLY_MESSAGE}`);
    expect(projects.assertProjectWritableForBilling).not.toHaveBeenCalled();
    expect(handoffModel.findOne).not.toHaveBeenCalled();
    expect(item.save).not.toHaveBeenCalled();
  });
});

// ─── Answering a check-in ────────────────────────────────────────────────────

describe('answering a check-in (R53: unchanged for the people it asks)', () => {
  function checkIns(participants: string[]) {
    const s: any = make(AsyncCheckInsService, { projectsService: projectsService('passes'), notifications });
    s.findCheckInRecord = jest.fn(async () => ({
      _id: new Types.ObjectId(RECORD_ID),
      status: AsyncCheckInStatus.OPEN,
      participantIds: participants.map((id) => new Types.ObjectId(id)),
    }));
    return s;
  }

  it('a viewer it asks can answer', async () => {
    const s = checkIns([ID.member, ID.viewer]);
    expect(await outcome(() => s.upsertMyResponse(PROJECT_ID, RECORD_ID, ID.viewer, {}))).toBe('400 Progress is required');
  });

  it('a viewer it does not ask cannot', async () => {
    const s = checkIns([ID.member]);
    expect(await outcome(() => s.upsertMyResponse(PROJECT_ID, RECORD_ID, ID.viewer, {}))).toBe('403 You were not included in this Check-in');
  });

  it('a spectator cannot', async () => {
    const s = checkIns([ID.member, ID.spectator]);
    const result = await outcome(() => s.upsertMyResponse(PROJECT_ID, RECORD_ID, ID.spectator, {}));
    expect(result.startsWith('403 ')).toBe(true);
  });
});
