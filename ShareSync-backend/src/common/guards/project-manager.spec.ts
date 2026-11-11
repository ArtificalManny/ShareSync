import { Types } from 'mongoose';
import { isProjectManager, projectStanding } from './project-standing';

// openshare-project-standing-v2 (R52)

const actor = '507f191e810c19729de860ea';
const other = '507f1f77bcf86cd799439012';
const oid = (id: string) => new Types.ObjectId(id);

const CASES: Array<[string, any, string, boolean]> = [
  ['owner by ownerId', { ownerId: oid(actor) }, actor, true],
  ['owner by ownerId as text', { ownerId: actor }, actor, true],
  ['owner by legacy owner', { owner: oid(actor) }, actor, true],
  ['owner by createdBy', { createdBy: oid(actor) }, actor, true],
  ['owner by createdById', { createdById: oid(actor) }, actor, true],
  ['ownerId wins over an older owner alias', { ownerId: oid(other), owner: oid(actor) }, actor, false],
  ['the owner of an archived project', { ownerId: oid(actor), isArchived: true }, actor, true],
  ['admin', { ownerId: oid(other), members: [{ userId: oid(actor), role: 'admin' }] }, actor, true],
  ['member with owner role', { ownerId: oid(other), members: [{ userId: oid(actor), role: 'owner' }] }, actor, true],
  ['admin in capitals with spaces', { ownerId: oid(other), members: [{ userId: oid(actor), role: ' ADMIN ' }] }, actor, true],
  ['admin by user', { members: [{ user: oid(actor), role: 'admin' }] }, actor, true],
  ['admin by memberId', { members: [{ memberId: oid(actor), role: 'admin' }] }, actor, true],
  ['member', { ownerId: oid(other), members: [{ userId: oid(actor), role: 'member' }] }, actor, false],
  ['member without a role', { ownerId: oid(other), members: [{ userId: oid(actor) }] }, actor, false],
  ['member with an empty role', { ownerId: oid(other), members: [{ userId: oid(actor), role: '' }] }, actor, false],
  ['member stored as an ID', { ownerId: oid(other), members: [oid(actor)] }, actor, false],
  ['viewer', { ownerId: oid(other), members: [{ userId: oid(actor), role: 'viewer' }] }, actor, false],
  ['guest', { ownerId: oid(other), members: [{ userId: oid(actor), role: 'guest' }] }, actor, false],
  ['unknown role', { ownerId: oid(other), members: [{ userId: oid(actor), role: 'superuser' }] }, actor, false],
  ['spectator of a public project', { ownerId: oid(other), visibility: 'public' }, actor, false],
  ['outsider of a private project', { ownerId: oid(other), visibility: 'private' }, actor, false],
  ['someone else is the admin', { ownerId: oid(other), members: [{ userId: oid(other), role: 'admin' }] }, actor, false],
  ['the first entry for the user decides', { members: [{ userId: oid(actor), role: 'viewer' }, { userId: oid(actor), role: 'admin' }] }, actor, false],
  ['no project', null, actor, false],
  ['malformed user ID', { ownerId: 'not-an-id' }, 'not-an-id', false],
  ['upper-case user ID', { ownerId: oid(actor) }, actor.toUpperCase(), true],
];

describe('R52 project managers', () => {
  it.each(CASES)('%s', (_label, project, userId, expected) => {
    expect(isProjectManager(project, userId)).toBe(expected);
  });

  it.each(CASES)('only ever names someone who may also write: %s', (_label, project, userId) => {
    if (isProjectManager(project, userId)) {
      expect(projectStanding(project, userId)).toBe('writer');
    }
  });

  it('refuses a user ID that is not text', () => {
    expect(isProjectManager({ ownerId: oid(actor) }, oid(actor) as any)).toBe(false);
    expect(isProjectManager({ ownerId: oid(actor) }, undefined as any)).toBe(false);
  });
});
