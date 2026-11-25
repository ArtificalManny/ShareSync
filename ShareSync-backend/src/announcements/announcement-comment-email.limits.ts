import { Types } from 'mongoose';

// Conservative pilot limits. They apply only to announcement comment email.
export const COMMENT_EMAIL_LIMITS = Object.freeze({
  recipientsPerEvent: 100,
  eventsPerAnnouncement: 100,
  eventsPerActorAnnouncementPerMinute: 5,
  providerAttemptsPerMinute: 20,
  providerAttemptsPerUtcDay: 50,
  budgetDeferralMs: 60_000,
});
export const COMMENT_EMAIL_BUDGET_COLLECTION = 'announcement_comment_email_budget_v1';

export function commentEmailAdmission(actorId: Types.ObjectId) {
  const events = { $ifNull: ['$commentEmailOutbox', []] };
  return { $expr: { $and: [
    { $lt: [{ $size: events }, COMMENT_EMAIL_LIMITS.eventsPerAnnouncement] },
    { $lt: [{ $size: { $filter: { input: events, as: 'event', cond: { $and: [
      { $eq: ['$$event.actorId', actorId] },
      { $gte: ['$$event.queuedAt', { $subtract: ['$$NOW', 60_000] }] },
    ] } } } }, COMMENT_EMAIL_LIMITS.eventsPerActorAnnouncementPerMinute] },
  ] } };
}

// MongoDB server time and one stable document give all workers a shared budget.
// Reserve BEFORE a provider call; a crash may waste a slot but cannot refund it.
export async function reserveCommentEmailBudget(collection: any): Promise<boolean> {
  const id = 'comment-email-global-v1';
  try {
    await collection.updateOne({ _id: id }, { $setOnInsert: { dayCount: 0, minuteCount: 0 } }, { upsert: true });
  } catch (error: any) {
    if (error?.code !== 11000) throw error;
  }
  const day = { $dateTrunc: { date: '$$NOW', unit: 'day', timezone: 'UTC' } };
  const minute = { $dateTrunc: { date: '$$NOW', unit: 'minute', timezone: 'UTC' } };
  const count = (field: string, window: any, counter: string) => ({
    $cond: [{ $eq: [`$${field}`, window] }, { $ifNull: [`$${counter}`, 0] }, 0],
  });
  const dayCount = count('day', day, 'dayCount');
  const minuteCount = count('minute', minute, 'minuteCount');
  const result = await collection.updateOne({ _id: id, $expr: { $and: [
    { $lt: [dayCount, COMMENT_EMAIL_LIMITS.providerAttemptsPerUtcDay] },
    { $lt: [minuteCount, COMMENT_EMAIL_LIMITS.providerAttemptsPerMinute] },
  ] } }, [{ $set: { day, minute, dayCount: { $add: [dayCount, 1] }, minuteCount: { $add: [minuteCount, 1] } } }]);
  return result.modifiedCount === 1;
}
