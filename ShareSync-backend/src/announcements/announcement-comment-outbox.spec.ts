import { Types } from 'mongoose';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementSchema } from './schemas/announcements.schema';

const actor = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const recipient = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const muted = 'cccccccccccccccccccccccc';
const projectId = 'dddddddddddddddddddddddd';
const annId = 'eeeeeeeeeeeeeeeeeeeeeeee';

function fixture(project: any, archived = false) {
  const existing = { projectId: new Types.ObjectId(projectId), archived };
  const result = { _id: annId, comments: [] };
  const query = { select: jest.fn().mockReturnThis(), populate: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue(result) };
  const lookup = { select: jest.fn().mockReturnThis(), lean: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue(project) };
  const announcements = { findById: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(existing) }), findByIdAndUpdate: jest.fn().mockReturnValue(query), findOneAndUpdate: jest.fn().mockReturnValue(query) };
  const projects = { findById: jest.fn().mockReturnValue(lookup) };
  const service = new AnnouncementsService({} as any, announcements as any, projects as any, {} as any, {} as any, {} as any);
  return { service, announcements, projects, lookup, query, result };
}

const project = { ownerId: recipient, members: [{ userId: actor }, { userId: muted, preferences: { announcements: false } }] };

describe('announcement comment email outbox (no provider calls)', () => {
  const flag = 'ANNOUNCEMENT_COMMENT_EMAIL_ENABLED';
  let prior: string | undefined;
  beforeEach(() => { prior = process.env[flag]; process.env[flag] = 'true'; });
  afterEach(() => { if (prior === undefined) delete process.env[flag]; else process.env[flag] = prior; });

  it('writes comment and recipient snapshot together and hides outbox in response', async () => {
    const f = fixture(project);
    expect(await f.service.addComment(annId, actor, 'test')).toBe(f.result);
    expect(f.announcements.findOneAndUpdate).toHaveBeenCalledTimes(1);
    expect(f.announcements.findByIdAndUpdate).not.toHaveBeenCalled();
    const push = f.announcements.findOneAndUpdate.mock.calls[0][1].$push;
    expect(String(push.commentEmailOutbox.commentId)).toBe(String(push.comments._id));
    expect(String(push.commentEmailOutbox.actorId)).toBe(actor);
    expect(push.commentEmailOutbox.recipientIds.map(String)).toEqual([recipient]);
    expect(Object.keys(push.commentEmailOutbox).sort()).toEqual(['actorId', 'attempts', 'commentId', 'cursor', 'leaseUntil', 'nextAttemptAt', 'queuedAt', 'recipientIds']);
    expect(f.query.select).toHaveBeenCalledWith('-commentEmailOutbox');
    expect(AnnouncementSchema.path('commentEmailOutbox').options.select).toBe(false);
  });
  it('does not resolve recipients or queue when disabled', async () => {
    process.env[flag] = 'false';
    const f = fixture(project);
    await f.service.addComment(annId, actor, 'test');
    expect(f.projects.findById).not.toHaveBeenCalled();
    expect(f.announcements.findByIdAndUpdate.mock.calls[0][1].$push.commentEmailOutbox).toBeUndefined();
  });
  it('saves without email event when project lookup fails', async () => {
    const f = fixture(project);
    f.lookup.exec.mockRejectedValueOnce(new Error('lookup unavailable'));
    expect(await f.service.addComment(annId, actor, 'test')).toBe(f.result);
    expect(f.announcements.findByIdAndUpdate.mock.calls[0][1].$push.commentEmailOutbox).toBeUndefined();
  });
  it('does not enqueue for archived announcements or no eligible recipients', async () => {
    for (const f of [fixture(project, true), fixture({ ownerId: actor, members: [] }), fixture({ ownerId: recipient, members: [] })]) {
      await f.service.addComment(annId, actor, 'test');
      expect(f.announcements.findByIdAndUpdate.mock.calls[0][1].$push.commentEmailOutbox).toBeUndefined();
    }
  });
  it('does not persist any notification event independently of a failed comment update', async () => {
    const f = fixture(project);
    f.query.exec.mockRejectedValueOnce(new Error('write failed'));
    await expect(f.service.addComment(annId, actor, 'test')).rejects.toThrow('write failed');
    expect(f.announcements.findOneAndUpdate).toHaveBeenCalledTimes(1);
    expect(f.announcements.findByIdAndUpdate).not.toHaveBeenCalled();
  });
  it('preserves comment when atomic outbox admission is denied', async () => {
    const f = fixture(project);
    f.query.exec.mockResolvedValueOnce(null);
    expect(await f.service.addComment(annId, actor, 'test')).toBe(f.result);
    const [filter, update] = f.announcements.findOneAndUpdate.mock.calls[0];
    expect(filter.$expr).toBeDefined();
    const fallback = f.announcements.findByIdAndUpdate.mock.calls[0][1].$push;
    expect(fallback).toEqual({ comments: update.$push.comments });
  });
});
