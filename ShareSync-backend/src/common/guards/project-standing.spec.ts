import { Types } from 'mongoose';
import { announcementStanding } from '../../announcements/announcements-project-access.guard';
import { PROJECT_STANDING_FIELDS, actorIdOf, idText, projectStanding } from './project-standing';

// openshare-project-standing-v1 (R51)

const actor = '507f191e810c19729de860ea';
const other = '507f1f77bcf86cd799439012';
const oid = (id: string) => new Types.ObjectId(id);

const CASES: Array<[string, any, string, string]> = [
  ['owner by ownerId', { ownerId: oid(actor) }, actor, 'writer'],
  ['owner by ownerId as text', { ownerId: actor }, actor, 'writer'],
  ['owner by legacy owner', { owner: oid(actor) }, actor, 'writer'],
  ['owner by createdBy', { createdBy: oid(actor) }, actor, 'writer'],
  ['owner by createdById', { createdById: oid(actor) }, actor, 'writer'],
  ['ownerId wins over an older owner alias', { ownerId: oid(other), owner: oid(actor) }, actor, 'none'],
  ['member', { ownerId: oid(other), members: [{ userId: oid(actor), role: 'member' }] }, actor, 'writer'],
  ['admin', { ownerId: oid(other), members: [{ userId: oid(actor), role: 'admin' }] }, actor, 'writer'],
  ['member with owner role', { ownerId: oid(other), members: [{ userId: oid(actor), role: 'owner' }] }, actor, 'writer'],
  ['role in capitals with spaces', { ownerId: oid(other), members: [{ userId: oid(actor), role: ' ADMIN ' }] }, actor, 'writer'],
  ['member without a role', { ownerId: oid(other), members: [{ userId: oid(actor) }] }, actor, 'writer'],
  ['member with an empty role', { ownerId: oid(other), members: [{ userId: oid(actor), role: '' }] }, actor, 'writer'],
  ['viewer', { ownerId: oid(other), members: [{ userId: oid(actor), role: 'viewer' }] }, actor, 'reader'],
  ['guest', { ownerId: oid(other), members: [{ userId: oid(actor), role: 'guest' }] }, actor, 'reader'],
  ['unknown role', { ownerId: oid(other), members: [{ userId: oid(actor), role: 'superuser' }] }, actor, 'reader'],
  ['member by user', { members: [{ user: oid(actor), role: 'member' }] }, actor, 'writer'],
  ['member by memberId', { members: [{ memberId: oid(actor), role: 'viewer' }] }, actor, 'reader'],
  ['member stored as an ID', { members: [oid(actor)] }, actor, 'writer'],
  ['member stored as text', { members: [actor] }, actor, 'writer'],
  ['viewer of a public project', { visibility: 'public', members: [{ userId: oid(actor), role: 'viewer' }] }, actor, 'reader'],
  ['spectator of a public project', { ownerId: oid(other), visibility: 'public' }, actor, 'spectator'],
  ['spectator of a listed project', { ownerId: oid(other), visibility: 'LISTED' }, actor, 'spectator'],
  ['spectator by isPublic', { ownerId: oid(other), isPublic: true }, actor, 'spectator'],
  ['spectator by public', { ownerId: oid(other), public: true }, actor, 'spectator'],
  ['spectator by settings.isPublic', { ownerId: oid(other), settings: { isPublic: true } }, actor, 'spectator'],
  ['isPublic must be true, not truthy', { ownerId: oid(other), isPublic: 'yes' }, actor, 'none'],
  ['archived public project', { ownerId: oid(other), visibility: 'public', isArchived: true }, actor, 'none'],
  ['archived by status', { ownerId: oid(other), visibility: 'public', status: 'Archived' }, actor, 'none'],
  ['deleted by status', { ownerId: oid(other), visibility: 'public', status: 'deleted' }, actor, 'none'],
  ['the owner of an archived project', { ownerId: oid(actor), isArchived: true }, actor, 'writer'],
  ['outsider of a private project', { ownerId: oid(other), visibility: 'private' }, actor, 'none'],
  ['someone else is a member', { ownerId: oid(other), members: [{ userId: oid(other) }] }, actor, 'none'],
  ['no project', null, actor, 'none'],
  ['malformed user ID', { ownerId: 'not-an-id' }, 'not-an-id', 'none'],
  ['upper-case user ID', { ownerId: oid(actor) }, actor.toUpperCase(), 'writer'],
];

describe('R51 project standing', () => {
  it.each(CASES)('%s', (_label, project, userId, expected) => {
    expect(projectStanding(project, userId)).toBe(expected);
  });

  it.each(CASES)('gives the same answer as the announcements guard: %s', (_label, project, userId) => {
    expect(projectStanding(project, userId)).toBe(announcementStanding(project, userId));
  });

  it('refuses a user ID that is not text', () => {
    expect(projectStanding({ ownerId: oid(actor) }, oid(actor) as any)).toBe('none');
    expect(projectStanding({ ownerId: oid(actor) }, undefined as any)).toBe('none');
  });

  it('names every field it reads, so callers can load them', () => {
    const fields = PROJECT_STANDING_FIELDS.split(' ');
    for (const field of ['ownerId', 'owner', 'createdBy', 'createdById', 'members', 'visibility', 'isPublic', 'public', 'settings.isPublic', 'status', 'isArchived']) {
      expect(fields).toContain(field);
    }
  });

  it('reads IDs only from ObjectIds and 24-character hex text', () => {
    expect(idText(oid(actor))).toBe(actor);
    expect(idText(` ${actor.toUpperCase()} `)).toBe(actor);
    expect(idText('abc')).toBe('');
    expect(idText({ toString: () => actor })).toBe('');
    expect(idText(12)).toBe('');
  });

  it('takes the signed-in user from the same fields, in the same order, as R50', () => {
    expect(actorIdOf({ userId: actor, sub: other })).toBe(actor);
    expect(actorIdOf({ _id: oid(actor) })).toBe(actor);
    expect(actorIdOf({ id: actor })).toBe(actor);
    expect(actorIdOf({ sub: actor })).toBe(actor);
    expect(actorIdOf({ userId: 'nope', sub: actor })).toBe(actor);
    expect(actorIdOf(undefined)).toBe('');
  });
});
