import { ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import {
  MEMBERS_ONLY_MESSAGE,
  READ_ONLY_MESSAGE,
  assertProjectMember,
  assertProjectWriter,
} from './project-write-standing';

// openshare-project-write-standing-v1 (R53)

const ID = {
  owner: '64a000000000000000000001',
  admin: '64a000000000000000000002',
  member: '64a000000000000000000003',
  norole: '64a000000000000000000004',
  viewer: '64a000000000000000000005',
  guest: '64a000000000000000000006',
  outsider: '64a000000000000000000007',
};

function project(over: Record<string, unknown> = {}) {
  return {
    _id: new Types.ObjectId('64a0000000000000000000aa'),
    ownerId: new Types.ObjectId(ID.owner),
    members: [
      { userId: new Types.ObjectId(ID.admin), role: 'admin' },
      { userId: new Types.ObjectId(ID.member), role: 'member' },
      { userId: new Types.ObjectId(ID.norole) },
      { userId: new Types.ObjectId(ID.viewer), role: 'viewer' },
      { userId: ID.guest, role: 'Guest' },
    ],
    visibility: 'private',
    status: 'active',
    ...over,
  };
}

function refusal(fn: () => void): string {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(ForbiddenException);
    return (error as ForbiddenException).message;
  }
  return 'allowed';
}

describe('assertProjectWriter (R53)', () => {
  it.each(['owner', 'admin', 'member', 'norole'] as const)('lets the %s change the project', (who) => {
    expect(refusal(() => assertProjectWriter(project(), ID[who]))).toBe('allowed');
  });

  it.each(['viewer', 'guest'] as const)('keeps a %s to reading', (who) => {
    expect(refusal(() => assertProjectWriter(project(), ID[who]))).toBe(READ_ONLY_MESSAGE);
  });

  it('keeps a spectator of a public project to reading', () => {
    expect(refusal(() => assertProjectWriter(project({ visibility: 'public' }), ID.outsider))).toBe(READ_ONLY_MESSAGE);
  });

  it('refuses an outsider of a private project', () => {
    expect(refusal(() => assertProjectWriter(project(), ID.outsider))).toBe(READ_ONLY_MESSAGE);
  });

  it('accepts the account ID as an ObjectId or in capitals', () => {
    expect(refusal(() => assertProjectWriter(project(), new Types.ObjectId(ID.member)))).toBe('allowed');
    expect(refusal(() => assertProjectWriter(project(), ID.owner.toUpperCase()))).toBe('allowed');
  });

  it('refuses a missing project or a malformed account ID', () => {
    expect(refusal(() => assertProjectWriter(null, ID.owner))).toBe(READ_ONLY_MESSAGE);
    expect(refusal(() => assertProjectWriter(project(), ''))).toBe(READ_ONLY_MESSAGE);
    expect(refusal(() => assertProjectWriter(project(), undefined))).toBe(READ_ONLY_MESSAGE);
    expect(refusal(() => assertProjectWriter(project(), { id: ID.owner }))).toBe(READ_ONLY_MESSAGE);
    expect(refusal(() => assertProjectWriter(project(), `${ID.owner} `))).toBe(READ_ONLY_MESSAGE);
  });
});

describe('assertProjectMember (R53)', () => {
  it.each(['owner', 'admin', 'member', 'norole', 'viewer', 'guest'] as const)('lets the %s answer for themselves', (who) => {
    expect(refusal(() => assertProjectMember(project(), ID[who]))).toBe('allowed');
  });

  it('refuses a spectator of a public project', () => {
    expect(refusal(() => assertProjectMember(project({ visibility: 'public' }), ID.outsider))).toBe(MEMBERS_ONLY_MESSAGE);
  });

  it('refuses someone removed from the project', () => {
    const removed = project({ visibility: 'listed' });
    removed.members = removed.members.filter((m: any) => String(m.userId) !== ID.viewer);
    expect(refusal(() => assertProjectMember(removed, ID.viewer))).toBe(MEMBERS_ONLY_MESSAGE);
  });

  it('refuses a missing project or a malformed account ID', () => {
    expect(refusal(() => assertProjectMember(undefined, ID.owner))).toBe(MEMBERS_ONLY_MESSAGE);
    expect(refusal(() => assertProjectMember(project(), 'not-an-id'))).toBe(MEMBERS_ONLY_MESSAGE);
  });
});
