import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';

/**
 * Permanent-account-deletion cleanup for data that is NOT destroyed by the
 * owned-project cascade.
 *
 * Policy:
 *
 * DELETE
 * - recipient-owned notifications / verification records
 * - follow relationships
 * - personal analytics / activity / gamification state
 * - personal presence/focus/context state
 *
 * RETAIN WITH NON-RESOLVING HISTORICAL USER ID
 * - messages authored by the deleted account
 * - comments/posts/shared-project contributions whose schema requires identity
 * - direct-message participant tombstone so the survivor keeps history
 *
 * REMOVE LIVE RELATIONSHIP
 * - group conversation membership
 * - DM recipient reference
 * - message mentions/read receipts/reactions
 * - collaborators / celebrations / upvotes
 *
 * ANONYMIZE COPIED IDENTITY
 * - notification actor metadata
 * - suggestion comment authorName
 * - conversation last-message sender display name
 *
 * This cleanup is intentionally explicit. Do not replace it with a generic
 * "remove every User reference" sweep: shared content belongs to surviving
 * collaborators too.
 */
@Injectable()
export class AccountDataCleanupService {
  private readonly logger = new Logger(AccountDataCleanupService.name);

  constructor(
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  private getCollections(modelNames: string[]): any[] {
    const collections: any[] = [];
    const seen = new Set<string>();

    for (const modelName of modelNames) {
      const model = (this.connection.models as Record<string, Model<any>>)[modelName];
      if (!model?.collection) continue;

      const key = String(
        model.collection.collectionName ||
        model.collection.name ||
        modelName,
      );

      if (seen.has(key)) continue;
      seen.add(key);
      collections.push(model.collection);
    }

    return collections;
  }

  private idVariants(userId: string): Array<Types.ObjectId | string> {
    return [new Types.ObjectId(userId), userId];
  }

  private normalizeId(value: any): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (value instanceof Types.ObjectId) return value.toString();

    if (typeof value?.toString === 'function') {
      return value.toString();
    }

    return String(value);
  }

  private async deleteByUserId(
    modelNames: string[],
    userId: string,
  ): Promise<void> {
    const ids = this.idVariants(userId);

    for (const collection of this.getCollections(modelNames)) {
      await collection.deleteMany({
        userId: { $in: ids },
      });
    }
  }

  private buildIdentityTokens(identity: any): string[] {
    const firstName = String(identity?.firstName || '').trim();
    const lastName = String(identity?.lastName || '').trim();
    const fullName = `${firstName} ${lastName}`.trim();

    const candidates = [
      String(identity?.displayName || '').trim(),
      fullName,
      String(identity?.username || '').trim(),
      String(identity?.email || '').trim(),
    ].filter(Boolean);

    if (candidates.length === 0 && firstName) {
      candidates.push(firstName);
    }

    return [...new Set(candidates)]
      .filter((value) => value.length >= 2)
      .sort((a, b) => b.length - a.length);
  }

  private scrubIdentityText(value: any, identityTokens: string[]): any {
    if (typeof value !== 'string' || identityTokens.length === 0) {
      return value;
    }

    let output = value;

    for (const token of identityTokens) {
      const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      output = output.replace(new RegExp(escaped, 'gi'), 'Deleted user');
    }

    return output;
  }

  private normalizeIdentityValue(value: any): string {
    if (value === null || value === undefined) return '';

    const normalized = this.normalizeId(value);
    return String(normalized || '').trim().toLowerCase();
  }

  private buildIdentityValues(
    userId: string,
    identity: any,
  ): Set<string> {
    const firstName = String(identity?.firstName || '').trim();
    const lastName = String(identity?.lastName || '').trim();
    const fullName = `${firstName} ${lastName}`.trim();

    const candidates = [
      userId,
      identity?._id,
      identity?.id,
      identity?.userId,
      identity?.googleId,
      identity?.email,
      identity?.username,
      identity?.displayName,
      firstName,
      lastName,
      fullName,
      identity?.avatar,
      identity?.avatarUrl,
      identity?.profilePicture,
      identity?.profileImage,
      identity?.photoUrl,
      identity?.image,
      identity?.imageUrl,
    ];

    return new Set(
      candidates
        .map((value) => this.normalizeIdentityValue(value))
        .filter(Boolean),
    );
  }

  private scrubNotificationData(
    value: any,
    identityTokens: string[],
    deletedIdentityValues: Set<string>,
    key?: string,
  ): any {
    const normalizedKey = String(key || '').toLowerCase();

    // These keys MAY contain identity. Do not remove them merely because of
    // their name: a notification payload can also contain the surviving
    // recipient's userId/email/etc.
    const identityKeys = new Set([
      '_id',
      'userid',
      'senderid',
      'actorid',
      'authorid',
      'triggeredby',
      'createdby',
      'email',
      'senderemail',
      'actoremail',
      'authoremail',
      'username',
      'senderusername',
      'actorusername',
      'authorusername',
      'googleid',
      'avatar',
      'avatarurl',
      'senderavatar',
      'actoravatar',
      'authoravatar',
      'profilepicture',
      'profileimage',
      'photourl',
      'image',
      'imageurl',
    ]);

    const displayNameKeys = new Set([
      'actorname',
      'sendername',
      'authorname',
      'displayname',
      'firstname',
      'lastname',
    ]);

    const comparable = this.normalizeIdentityValue(value);
    const belongsToDeletedUser =
      Boolean(comparable) &&
      deletedIdentityValues.has(comparable);

    if (
      identityKeys.has(normalizedKey) &&
      belongsToDeletedUser
    ) {
      return undefined;
    }

    if (
      displayNameKeys.has(normalizedKey) &&
      belongsToDeletedUser
    ) {
      return 'Deleted user';
    }

    // Preserve BSON/date primitives instead of recursively converting them
    // into ordinary objects.
    if (value instanceof Types.ObjectId || value instanceof Date) {
      return value;
    }

    if (typeof value === 'string') {
      return this.scrubIdentityText(value, identityTokens);
    }

    if (Array.isArray(value)) {
      return value
        .map((entry) =>
          this.scrubNotificationData(
            entry,
            identityTokens,
            deletedIdentityValues,
          ),
        )
        .filter((entry) => entry !== undefined);
    }

    if (value && typeof value === 'object') {
      const output: Record<string, any> = {};

      for (const [childKey, childValue] of Object.entries(value)) {
        const scrubbed = this.scrubNotificationData(
          childValue,
          identityTokens,
          deletedIdentityValues,
          childKey,
        );

        if (scrubbed !== undefined) {
          output[childKey] = scrubbed;
        }
      }

      return output;
    }

    return value;
  }

  private async cleanupNotifications(
    userId: string,
    identity: any,
  ): Promise<void> {
    const ids = this.idVariants(userId);
    const identityTokens = this.buildIdentityTokens(identity);
    const deletedIdentityValues = this.buildIdentityValues(
      userId,
      identity,
    );

    for (const collection of this.getCollections([
      'Notification',
      'Notifications',
    ])) {
      // Notifications addressed to the deleted account belong only to it.
      await collection.deleteMany({
        userId: { $in: ids },
      });

      // Notifications belonging to surviving users may still describe an
      // action performed by the deleted account. Retain the event, but remove
      // the live actor reference and copied identity.
      const cursor = collection.find(
        {
          triggeredBy: { $in: ids },
        },
        {
          projection: {
            title: 1,
            message: 1,
            body: 1,
            data: 1,
          },
        },
      );

      for await (const notification of cursor) {
        const set: Record<string, any> = {};

        for (const field of ['title', 'message', 'body']) {
          if (typeof notification?.[field] === 'string') {
            set[field] = this.scrubIdentityText(
              notification[field],
              identityTokens,
            );
          }
        }

        if (notification?.data && typeof notification.data === 'object') {
          set.data = this.scrubNotificationData(
            notification.data,
            identityTokens,
            deletedIdentityValues,
          );
        }

        const update: Record<string, any> = {
          $unset: {
            triggeredBy: '',
          },
        };

        if (Object.keys(set).length > 0) {
          update.$set = set;
        }

        await collection.updateOne(
          { _id: notification._id },
          update,
        );
      }
    }

    await this.deleteByUserId(
      ['NotificationVerification'],
      userId,
    );
  }

  private async cleanupFollows(userId: string): Promise<void> {
    await this.deleteByUserId(
      ['Follow', 'ProjectFollow'],
      userId,
    );
  }

  private async cleanupPersonalAnalyticsAndState(
    userId: string,
  ): Promise<void> {
    // These records describe the deleted account itself rather than shared
    // collaborative content.
    await this.deleteByUserId(
      [
        'EventLog',
        'Activity',
        'UserStats',
        'Achievement',
        'Ceremony',
        'DailyFocusPlan',
        'Settings',
        'UserContext',
        'Presence',
        'FocusSession',
        'Cursor',
        'Integration',
      ],
      userId,
    );
  }

  private async cleanupGamificationReferences(
    userId: string,
  ): Promise<void> {
    const ids = this.idVariants(userId);

    // The deleted user's own Hall of Fame entries should not survive as
    // public personal achievements.
    for (const collection of this.getCollections([
      'HallOfFameEntry',
      'HallOfFame',
    ])) {
      await collection.deleteMany({
        userId: { $in: ids },
      });

      // Preserve other users' achievements, but remove the deleted account
      // from their celebration history and keep the cached count correct.
      await collection.updateMany(
        {
          celebratedBy: { $in: ids },
        },
        [
          {
            $set: {
              celebratedBy: {
                $filter: {
                  input: { $ifNull: ['$celebratedBy', []] },
                  as: 'celebrator',
                  cond: {
                    $ne: [
                      { $toString: '$$celebrator' },
                      userId,
                    ],
                  },
                },
              },
            },
          },
          {
            $set: {
              celebrationCount: {
                $size: { $ifNull: ['$celebratedBy', []] },
              },
            },
          },
        ] as any,
      );
    }

    // UserStats belonging to the deleted user were removed above. This handles
    // surviving users who listed the deleted account as a collaborator.
    for (const collection of this.getCollections(['UserStats'])) {
      await collection.updateMany(
        {
          collaborators: { $in: ids },
        },
        {
          $pull: {
            collaborators: { $in: ids },
          },
        } as any,
      );
    }
  }

  private async cleanupConversations(userId: string): Promise<void> {
    const ids = this.idVariants(userId);

    for (const collection of this.getCollections(['Conversation'])) {
      // In shared/group conversations the deleted account should no longer be
      // a participant.
      await collection.updateMany(
        {
          type: { $ne: 'direct' },
          'participants.userId': { $in: ids },
        },
        {
          $pull: {
            participants: {
              userId: { $in: ids },
            },
          },
        } as any,
      );

      // In 1:1 DMs keep the participant ObjectId as a non-resolving tombstone.
      // Removing it would destroy the two-party structure that lets the
      // surviving user retain the conversation history.

      await collection.updateMany(
        {
          createdBy: { $in: ids },
        },
        {
          $unset: {
            createdBy: '',
          },
        },
      );

      await collection.updateMany(
        {
          'lastMessage.senderId': { $in: ids },
        },
        {
          $unset: {
            'lastMessage.senderId': '',
          },
          $set: {
            'lastMessage.senderName': 'Deleted user',
          },
        },
      );
    }
  }

  private async cleanupMessageReactions(
    collection: any,
    userId: string,
  ): Promise<void> {
    const cursor = collection.find(
      {
        reactions: { $exists: true },
      },
      {
        projection: {
          reactions: 1,
        },
      },
    );

    for await (const message of cursor) {
      const reactions = message?.reactions;

      if (!reactions) continue;

      // Modern schema:
      // [{ emoji, users: [ObjectId], count }]
      if (Array.isArray(reactions)) {
        let changed = false;

        const nextReactions = reactions.map((reaction: any) => {
          if (!reaction || !Array.isArray(reaction.users)) {
            return reaction;
          }

          const users = reaction.users.filter(
            (value: any) => this.normalizeId(value) !== userId,
          );

          if (users.length !== reaction.users.length) {
            changed = true;
          }

          return {
            ...reaction,
            users,
            count: users.length,
          };
        });

        if (changed) {
          await collection.updateOne(
            { _id: message._id },
            {
              $set: {
                reactions: nextReactions,
              },
            },
          );
        }

        continue;
      }

      // Runtime legacy schema:
      // { '👍': ['userId1', 'userId2'] }
      if (typeof reactions === 'object') {
        let changed = false;
        const nextReactions: Record<string, any> = {};

        for (const [emoji, users] of Object.entries(reactions)) {
          if (!Array.isArray(users)) {
            nextReactions[emoji] = users;
            continue;
          }

          const filtered = users.filter(
            (value: any) => this.normalizeId(value) !== userId,
          );

          if (filtered.length !== users.length) {
            changed = true;
          }

          nextReactions[emoji] = filtered;
        }

        if (changed) {
          await collection.updateOne(
            { _id: message._id },
            {
              $set: {
                reactions: nextReactions,
              },
            },
          );
        }
      }
    }
  }

  private async cleanupMessages(userId: string): Promise<void> {
    const ids = this.idVariants(userId);

    for (const collection of this.getCollections(['Message'])) {
      // senderId is deliberately retained. Both known Message schemas require
      // it, and after User deletion it becomes a non-resolving historical
      // author identifier with no profile/PII behind it.

      // recipientId is an optional live relationship in the runtime schema.
      await collection.updateMany(
        {
          recipientId: { $in: ids },
        },
        {
          $unset: {
            recipientId: '',
          },
        },
      );

      // These fields exist in the newer Message shape and may exist in older
      // persisted rows even while the runtime module uses the legacy schema.
      await collection.updateMany(
        {
          'readBy.userId': { $in: ids },
        },
        {
          $pull: {
            readBy: {
              userId: { $in: ids },
            },
          },
        } as any,
      );

      await collection.updateMany(
        {
          mentions: { $in: ids },
        },
        {
          $pull: {
            mentions: { $in: ids },
          },
        } as any,
      );

      await this.cleanupMessageReactions(collection, userId);
    }
  }


  private async cleanupTaskRelationships(
    userId: string,
  ): Promise<void> {
    const ids = this.idVariants(userId);

    for (const collection of this.getCollections(['Task'])) {
      // Assignment/reporting fields represent current live relationships.
      // They must not continue pointing at a deleted account.
      const liveRelationshipFields = [
        'assigneeId',
        'assignee',
        'assignedTo',
        'assignedToId',
        'reporterId',
        'reporter',
      ];

      for (const field of liveRelationshipFields) {
        await collection.updateMany(
          {
            [field]: { $in: ids },
          },
          {
            $unset: {
              [field]: '',
            },
          },
        );
      }

      // Do NOT unset required createdBy/createdById here.
      // Shared task history survives with a non-resolving historical author ID.
    }
  }

  private async cleanupSuggestions(userId: string): Promise<void> {
    const ids = this.idVariants(userId);

    for (const collection of this.getCollections(['Suggestion'])) {
      // Votes are relationships, not historical authored content.
      await collection.updateMany(
        {
          upvotes: { $in: ids },
        },
        {
          $pull: {
            upvotes: { $in: ids },
          },
        } as any,
      );

      // Keep a surviving project's suggestion discussion, but remove copied
      // identity from comments authored by the deleted account.
      await collection.updateMany(
        {
          'comments.authorId': { $in: ids },
        },
        {
          $set: {
            'comments.$[deletedAuthor].authorName': 'Deleted user',
          },
          $unset: {
            'comments.$[deletedAuthor].authorEmail': '',
            'comments.$[deletedAuthor].username': '',
            'comments.$[deletedAuthor].avatar': '',
            'comments.$[deletedAuthor].avatarUrl': '',
            'comments.$[deletedAuthor].profilePicture': '',
          },
        },
        {
          arrayFilters: [
            {
              'deletedAuthor.authorId': { $in: ids },
            },
          ],
        } as any,
      );
    }
  }

  async cleanupForAccountDeletion(
    userId: string,
    identity?: any,
  ): Promise<void> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user id for account cleanup');
    }

    this.logger.log(
      `Starting shared/account-scoped cleanup for user ${userId}`,
    );

    // Deliberately sequential. Account deletion is rare, and deterministic
    // fail-closed behavior is more valuable here than maximum throughput.
    await this.cleanupNotifications(userId, identity);
    await this.cleanupFollows(userId);
    await this.cleanupPersonalAnalyticsAndState(userId);
    await this.cleanupGamificationReferences(userId);
    await this.cleanupConversations(userId);
    await this.cleanupMessages(userId);
    await this.cleanupTaskRelationships(userId);
    await this.cleanupSuggestions(userId);

    this.logger.log(
      `Completed shared/account-scoped cleanup for user ${userId}`,
    );
  }
}
