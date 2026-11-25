import { Types } from 'mongoose';
import { AnnouncementCommentEmailWorker } from './announcement-comment-email.worker';

const actor = new Types.ObjectId('aaaaaaaaaaaaaaaaaaaaaaaa');
const recipient = new Types.ObjectId('bbbbbbbbbbbbbbbbbbbbbbbb');
const projectId = new Types.ObjectId('cccccccccccccccccccccccc');
const announcementId = new Types.ObjectId('dddddddddddddddddddddddd');
const commentId = new Types.ObjectId('eeeeeeeeeeeeeeeeeeeeeeee');
const prefix = 'commentEmailOutbox';

function fixture() {
  const event: any = { actorId: actor, commentId, recipientIds: [recipient], queuedAt: new Date(), cursor: 0, attempts: 0 };
  const doc = { _id: announcementId, projectId, [prefix]: [event] };
  const collection = {
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
    findOneAndUpdate: jest.fn(async (_filter: any, update: any) => {
      event.attempts += update.$inc[`${prefix}.$.attempts`];
      event.leaseToken = update.$set[`${prefix}.$.leaseToken`];
      event.leaseUntil = update.$set[`${prefix}.$.leaseUntil`];
      return doc;
    }),
    findOne: jest.fn().mockResolvedValue({ _id: announcementId }),
    updateOne: jest.fn().mockResolvedValue({ matchedCount: 1, modifiedCount: 1 }),
  };
  const lookup = (value: any) => ({ select: jest.fn().mockReturnThis(), lean: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue(value) });
  const projectLookup = lookup({ ownerId: actor, members: [{ userId: recipient }] });
  const userLookup = lookup({ _id: recipient, isActive: true, email: 'recipient@example.test', isEmailVerified: true });
  const email = { sendAnnouncementCommentEmail: jest.fn().mockResolvedValue({ status: 'accepted', providerMessageId: 'provider-id' }) };
  const budget = { updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }) };
  const worker = new AnnouncementCommentEmailWorker({ collection, db: { collection: () => budget } } as any, { findById: jest.fn().mockReturnValue(projectLookup) } as any,
    { findById: jest.fn().mockReturnValue(userLookup) } as any, email as any);
  return { worker, collection, event, email, projectLookup, userLookup, budget };
}

describe('announcement comment email worker (mocked persistence and provider)', () => {
  let prior: NodeJS.ProcessEnv;
  beforeEach(() => {
    prior = process.env;
    process.env = { ...prior, ANNOUNCEMENT_COMMENT_EMAIL_ENABLED: 'true', ANNOUNCEMENT_COMMENT_EMAIL_DISPATCH_ENABLED: 'true' };
  });
  afterEach(() => { process.env = prior; });

  it('requires both explicit feature switches', async () => {
    for (const flag of ['ANNOUNCEMENT_COMMENT_EMAIL_ENABLED', 'ANNOUNCEMENT_COMMENT_EMAIL_DISPATCH_ENABLED']) {
      process.env[flag] = 'false';
      const f = fixture();
      await f.worker.tick();
      expect(f.collection.findOneAndUpdate).not.toHaveBeenCalled();
      expect(f.email.sendAnnouncementCommentEmail).not.toHaveBeenCalled();
      process.env[flag] = 'true';
    }
  });
  it('atomically claims, rechecks comment and records accepted recipient with lease fencing', async () => {
    const f = fixture();
    await f.worker.tick();
    expect(f.collection.findOneAndUpdate).toHaveBeenCalledTimes(1);
    expect(f.collection.findOne).toHaveBeenCalledTimes(1);
    expect(f.email.sendAnnouncementCommentEmail).toHaveBeenCalledWith(expect.objectContaining({ _id: recipient }), {
      projectId: String(projectId), announcementId: String(announcementId), commentId: String(commentId), recipientId: String(recipient),
    });
    const [filter, update] = f.collection.updateOne.mock.calls[0];
    expect(filter[prefix].$elemMatch.leaseToken).toBe(f.event.leaseToken);
    expect(update.$set[`${prefix}.$.cursor`]).toBe(1);
    expect(update.$set[`${prefix}.$.completedAt`]).toBeInstanceOf(Date);
    expect(update.$push[`${prefix}.$.results`]).toMatchObject({ recipientId: recipient, status: 'accepted', providerMessageId: 'provider-id', attempts: 1 });
  });
  it('does not send to removed or muted members', async () => {
    for (const members of [[], [{ userId: recipient, preferences: { announcements: false } }]]) {
      const f = fixture();
      f.projectLookup.exec.mockResolvedValue({ ownerId: actor, members });
      await f.worker.tick();
      expect(f.email.sendAnnouncementCommentEmail).not.toHaveBeenCalled();
      expect(f.collection.updateOne.mock.calls[0][1].$push[`${prefix}.$.results`].status).toBe('skipped');
    }
  });
  it('does not send when comment or lease no longer exists', async () => {
    const f = fixture();
    f.collection.findOne.mockResolvedValue(null);
    await f.worker.tick();
    expect(f.email.sendAnnouncementCommentEmail).not.toHaveBeenCalled();
  });
  it('retries a transient failure without advancing the recipient cursor', async () => {
    const f = fixture();
    f.email.sendAnnouncementCommentEmail.mockResolvedValue({ status: 'failed', retryable: true, reason: 'provider-error' });
    await f.worker.tick();
    const update = f.collection.updateOne.mock.calls[0][1];
    expect(update.$set[`${prefix}.$.attempts`]).toBe(1);
    expect(update.$set[`${prefix}.$.nextAttemptAt`].getTime()).toBeGreaterThan(Date.now() + 20_000);
    expect(update.$set[`${prefix}.$.cursor`]).toBeUndefined();
  });
  it('terminates permanent or exhausted failures and never sends expired events', async () => {
    for (const retryable of [false, true]) {
      const f = fixture();
      f.event.attempts = retryable ? 3 : 0;
      f.email.sendAnnouncementCommentEmail.mockResolvedValue({ status: 'failed', retryable, reason: 'provider-error' });
      await f.worker.tick();
      expect(f.collection.updateOne.mock.calls[0][1].$push[`${prefix}.$.results`].status).toBe('failed');
    }
    const f = fixture();
    f.event.queuedAt = new Date(Date.now() - 7 * 60 * 60_000);
    await f.worker.tick();
    expect(f.email.sendAnnouncementCommentEmail).not.toHaveBeenCalled();
    expect(f.collection.updateOne.mock.calls[0][1].$set[`${prefix}.$.completionReason`]).toBe('expired');
  });
  it('counts abandoned claims against the retry budget', async () => {
    const f = fixture();
    f.event.attempts = 4;
    await f.worker.tick();
    expect(f.email.sendAnnouncementCommentEmail).not.toHaveBeenCalled();
    expect(f.collection.updateOne.mock.calls[0][1].$push[`${prefix}.$.results`]).toMatchObject({ status: 'failed', reason: 'attempt-budget-exhausted' });
  });
  it('defers a budget denial without consuming the recipient retry budget', async () => {
    const f = fixture();
    f.budget.updateOne.mockResolvedValueOnce({ modifiedCount: 0 }).mockResolvedValueOnce({ modifiedCount: 0 });
    await f.worker.tick();
    expect(f.email.sendAnnouncementCommentEmail).not.toHaveBeenCalled();
    const update = f.collection.updateOne.mock.calls[0][1];
    expect(update.$inc[`${prefix}.$.attempts`]).toBe(-1);
    expect(update.$set[`${prefix}.$.nextAttemptAt`].getTime()).toBeGreaterThan(Date.now() + 50_000);
  });
  it('fails closed when the shared budget is unavailable', async () => {
    const f = fixture();
    f.budget.updateOne.mockRejectedValueOnce(new Error('database unavailable'));
    await f.worker.tick();
    expect(f.email.sendAnnouncementCommentEmail).not.toHaveBeenCalled();
    expect(f.collection.updateOne.mock.calls[0][1].$set[`${prefix}.$.cursor`]).toBeUndefined();
  });
  it('prevents local overlapping ticks', async () => {
    const f = fixture();
    await Promise.all([f.worker.tick(), f.worker.tick()]);
    expect(f.collection.findOneAndUpdate).toHaveBeenCalledTimes(1);
  });
});
