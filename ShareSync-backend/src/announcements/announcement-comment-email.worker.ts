import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomUUID } from 'crypto';
import { Announcement, AnnouncementDocument, AnnouncementCommentEmailEvent } from './schemas/announcements.schema';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { User, UserDocument } from '../user/schemas/user.schema';
import { EmailService, AnnouncementCommentEmailResult } from '../notifications/email.service';
import { announcementStanding } from './announcements-project-access.guard';
import { announcementCommentRecipients, announcementCommentEmailAddress, commentEmailId } from '../notifications/announcement-comment-email.policy';

import { COMMENT_EMAIL_LIMITS, COMMENT_EMAIL_BUDGET_COLLECTION, reserveCommentEmailBudget } from './announcement-comment-email.limits';

const LEASE_MS = 60_000;
const MAX_AGE_MS = 6 * 60 * 60_000;
const RETENTION_MS = 24 * 60 * 60_000;
const RETRY_MS = [30_000, 120_000, 600_000];
const PREFIX = 'commentEmailOutbox';

@Injectable()
export class AnnouncementCommentEmailWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AnnouncementCommentEmailWorker.name);
  private timer?: ReturnType<typeof setInterval>;
  private running = false;
  private stopping = false;
  private lastCleanup = 0;

  constructor(
    @InjectModel(Announcement.name) private readonly announcements: Model<AnnouncementDocument>,
    @InjectModel(Project.name) private readonly projects: Model<ProjectDocument>,
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    private readonly email: EmailService,
  ) {}

  private enabled(): boolean {
    return !this.stopping && process.env.ANNOUNCEMENT_COMMENT_EMAIL_ENABLED === 'true' &&
      process.env.ANNOUNCEMENT_COMMENT_EMAIL_DISPATCH_ENABLED === 'true';
  }

  onModuleInit(): void {
    if (!this.enabled()) return;
    this.timer = setInterval(() => { void this.tick(); }, 1000);
    this.timer.unref?.();
  }

  onModuleDestroy(): void {
    this.stopping = true;
    if (this.timer) clearInterval(this.timer);
  }

  // Native collection updates intentionally avoid changing announcement updatedAt or serializing outbox data.
  private get collection(): any { return this.announcements.collection; }

  async tick(): Promise<void> {
    if (!this.enabled() || this.running) return;
    this.running = true;
    try {
      const now = new Date();
      if (now.getTime() - this.lastCleanup >= 600_000) {
        this.lastCleanup = now.getTime();
        try { await this.cleanup(now); } catch { this.logger.warn('Announcement comment email cleanup failed'); }
      }
      const token = randomUUID();
      const claimAt = new Date();
      const leaseUntil = new Date(claimAt.getTime() + LEASE_MS);
      const doc = await this.collection.findOneAndUpdate({
        [PREFIX]: { $elemMatch: { completedAt: { $exists: false }, nextAttemptAt: { $lte: claimAt }, leaseUntil: { $lte: claimAt } } },
      }, { $set: { [`${PREFIX}.$.leaseToken`]: token, [`${PREFIX}.$.leaseUntil`]: leaseUntil },
        $inc: { [`${PREFIX}.$.attempts`]: 1 } }, {
        returnDocument: 'after', includeResultMetadata: false,
        projection: { _id: 1, projectId: 1, archived: 1, [PREFIX]: 1 },
        sort: { [`${PREFIX}.nextAttemptAt`]: 1 },
      });
      if (!doc) return;
      const event: AnnouncementCommentEmailEvent | undefined = doc[PREFIX]?.find((e: AnnouncementCommentEmailEvent) => e.leaseToken === token);
      if (!event) throw new Error('Claim result missing lease token');
      await this.process(doc, event, token);
    } catch {
      // Do not log provider payloads, addresses or user content. An abandoned lease expires.
      this.logger.warn('Announcement comment email worker operation failed');
    } finally {
      this.running = false;
    }
  }

  private async cleanup(now: Date): Promise<void> {
    const cutoff = new Date(now.getTime() - RETENTION_MS);
    await this.collection.updateMany({ [`${PREFIX}.completedAt`]: { $lte: cutoff } }, {
      $pull: { [PREFIX]: { completedAt: { $lte: cutoff } } },
    });
  }

  private claimFilter(doc: any, event: AnnouncementCommentEmailEvent, token: string) {
    return { _id: doc._id, [PREFIX]: { $elemMatch: {
      commentId: event.commentId, leaseToken: token, completedAt: { $exists: false },
    } } };
  }

  private async finish(doc: any, event: AnnouncementCommentEmailEvent, token: string, reason: string): Promise<void> {
    await this.collection.updateOne(this.claimFilter(doc, event, token), {
      $set: { [`${PREFIX}.$.completedAt`]: new Date(), [`${PREFIX}.$.completionReason`]: reason },
      $unset: { [`${PREFIX}.$.leaseToken`]: '', [`${PREFIX}.$.nextAttemptAt`]: '' },
    });
  }

  private async release(doc: any, event: AnnouncementCommentEmailEvent, token: string): Promise<void> {
    await this.collection.updateOne(this.claimFilter(doc, event, token), {
      $set: { [`${PREFIX}.$.leaseUntil`]: new Date(0) },
      $unset: { [`${PREFIX}.$.leaseToken`]: '' },
    });
  }

  private async process(doc: any, event: AnnouncementCommentEmailEvent, token: string): Promise<void> {
    const deadline = new Date(event.queuedAt).getTime() + MAX_AGE_MS;
    if (!Number.isFinite(deadline) || Date.now() + 15_000 >= deadline) return this.finish(doc, event, token, 'expired');
    if (!this.enabled()) return this.release(doc, event, token);
    const actor = commentEmailId(event.actorId);
    const projectId = commentEmailId(doc.projectId);
    const announcementId = commentEmailId(doc._id);
    const commentId = commentEmailId(event.commentId);
    const cursor = event.cursor;
    const attempts = event.attempts;
    if (!actor || !projectId || !announcementId || !commentId || !Array.isArray(event.recipientIds) ||
        !Number.isSafeInteger(cursor) || cursor < 0 || !Number.isSafeInteger(attempts) || attempts < 1) {
      return this.finish(doc, event, token, 'invalid-event');
    }
    if (cursor >= event.recipientIds.length) return this.finish(doc, event, token, 'processed');
    const recipientId = commentEmailId(event.recipientIds[cursor]);
    if (!recipientId || actor === recipientId) return this.finish(doc, event, token, 'invalid-recipient');
    let result: AnnouncementCommentEmailResult;
    try {
      if (attempts > RETRY_MS.length + 1) {
        result = { status: 'failed', retryable: false, reason: 'attempt-budget-exhausted' };
      } else {
        const project = await this.projects.findById(projectId).select({ ownerId: 1, owner: 1, createdBy: 1, createdById: 1,
          members: 1, settings: 1, status: 1, isArchived: 1 }).lean().exec();
        const standing = announcementStanding(project, recipientId);
        if (!announcementCommentRecipients(project, actor).includes(recipientId) ||
            announcementStanding(project, actor) !== 'writer' || (standing !== 'writer' && standing !== 'reader')) {
          result = { status: 'skipped', reason: 'project-ineligible' };
        } else {
          const user = await this.users.findById(recipientId).select({ _id: 1, isActive: 1, email: 1, isEmailVerified: 1,
            emailOptOut: 1, 'settings.emailNotifications': 1, notificationChannels: 1, notificationPrefs: 1 }).lean().exec();
          if (!this.enabled() || Date.now() + 15_000 >= Math.min(deadline, new Date(event.leaseUntil).getTime())) {
            return this.release(doc, event, token);
          }
          // Verify that the claimed event and original comment still exist immediately before dispatch.
          const stillClaimed = await this.collection.findOne({
            _id: doc._id, projectId: doc.projectId, archived: { $ne: true },
            comments: { $elemMatch: { _id: new Types.ObjectId(commentId), authorId: new Types.ObjectId(actor) } },
            [PREFIX]: { $elemMatch: { commentId: event.commentId, leaseToken: token,
              leaseUntil: { $gt: new Date(Date.now() + 15_000) }, completedAt: { $exists: false } } },
          }, { projection: { _id: 1 } });
          if (!this.enabled() || Date.now() + 15_000 >= Math.min(deadline, new Date(event.leaseUntil).getTime())) {
            return this.release(doc, event, token);
          }
          if (!stillClaimed || !user || !announcementCommentEmailAddress(user)) {
            result = { status: 'skipped', reason: 'comment-or-recipient-unavailable' };
          } else {
            const budget = await reserveCommentEmailBudget(this.announcements.db.collection(COMMENT_EMAIL_BUDGET_COLLECTION));
            if (!budget) {
              // No provider attempt was made. Defer without consuming the retry budget.
              await this.collection.updateOne(this.claimFilter(doc, event, token), {
                $inc: { [`${PREFIX}.$.attempts`]: -1 },
                $set: { [`${PREFIX}.$.nextAttemptAt`]: new Date(Math.min(deadline, Date.now() + COMMENT_EMAIL_LIMITS.budgetDeferralMs)),
                  [`${PREFIX}.$.leaseUntil`]: new Date(0) },
                $unset: { [`${PREFIX}.$.leaseToken`]: '' },
              });
              return;
            }
            if (!this.enabled() || Date.now() + 15_000 >= Math.min(deadline, new Date(event.leaseUntil).getTime())) {
              return this.release(doc, event, token);
            }
            result = await this.email.sendAnnouncementCommentEmail(user, { projectId, announcementId, commentId, recipientId });
            if (result.status === 'skipped' && result.reason === 'disabled') return this.release(doc, event, token);
          }
        }
      }
    } catch {
      result = { status: 'failed', retryable: true, reason: 'lookup-or-dispatch-error' };
    }
    const now = new Date();
    const count = attempts;
    const retryAt = now.getTime() + (RETRY_MS[attempts - 1] || 0);
    if (result.status === 'failed' && result.retryable && attempts <= RETRY_MS.length && retryAt < deadline) {
      await this.collection.updateOne(this.claimFilter(doc, event, token), {
        $set: { [`${PREFIX}.$.attempts`]: count, [`${PREFIX}.$.nextAttemptAt`]: new Date(retryAt), [`${PREFIX}.$.leaseUntil`]: new Date(0) },
        $unset: { [`${PREFIX}.$.leaseToken`]: '' },
      });
      return;
    }
    const complete = cursor + 1 >= event.recipientIds.length;
    const set: Record<string, any> = { [`${PREFIX}.$.cursor`]: cursor + 1, [`${PREFIX}.$.attempts`]: 0, [`${PREFIX}.$.leaseUntil`]: new Date(0) };
    const unset: Record<string, string> = { [`${PREFIX}.$.leaseToken`]: '' };
    if (complete) {
      set[`${PREFIX}.$.completedAt`] = now;
      set[`${PREFIX}.$.completionReason`] = 'processed';
      unset[`${PREFIX}.$.nextAttemptAt`] = '';
    } else {
      set[`${PREFIX}.$.nextAttemptAt`] = now;
    }
    const outcome = { recipientId: new Types.ObjectId(recipientId), status: result.status, attempts: count, at: now,
      ...(result.status === 'accepted' ? { providerMessageId: result.providerMessageId } : { reason: result.reason }) };
    await this.collection.updateOne(this.claimFilter(doc, event, token), {
      $set: set, $unset: unset, $push: { [`${PREFIX}.$.results`]: outcome },
    });
  }
}
