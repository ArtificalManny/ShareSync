import {
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  InjectModel,
} from '@nestjs/mongoose';
import {
  Cron,
} from '@nestjs/schedule';
import {
  Model,
  Types,
} from 'mongoose';

import {
  ThreadMessage,
} from '../thread-messages/schemas/thread-message.schema';

import {
  TeamRoomPendingUpload,
} from './schemas/team-room-pending-upload.schema';

import {
  UploadsService,
} from './uploads.service';

@Injectable()
export class TeamRoomUploadCleanupService {
  private readonly logger =
    new Logger(
      TeamRoomUploadCleanupService.name,
    );

  constructor(
    @InjectModel(
      TeamRoomPendingUpload.name,
    )
    private readonly assetModel:
      Model<any>,

    @InjectModel(
      ThreadMessage.name,
    )
    private readonly messageModel:
      Model<any>,

    private readonly uploadsService:
      UploadsService,
  ) {}

  // openshare-team-room-upload-cleanup-v1
  //
  // Run often enough to keep abandoned storage bounded without making
  // upload/message requests depend on background cleanup.
  //
  // Billing and downgrade state are intentionally irrelevant here.
  @Cron('*/15 * * * *')
  async reconcileAndCleanup():
    Promise<void> {
    const now =
      new Date();

    // openshare-team-room-explicit-delete-retry-v1
    // Explicit user deletion takes priority over abandoned-upload cleanup.
    await this
      .reconcileDeletionRequests();

    await this
      .reconcileExpiredClaims(
        now,
      );

    await this
      .cleanupExpiredUnconsumedUploads(
        now,
      );
  }

  // openshare-team-room-thread-delete-cleanup-v1
  async stageDeletionRequestsForThread(
    threadId: string,
    projectId: string,
  ): Promise<void> {
    const normalizedThreadId =
      String(
        threadId || '',
      ).trim();

    const normalizedProjectId =
      String(
        projectId || '',
      ).trim();

    if (
      !Types.ObjectId.isValid(
        normalizedThreadId,
      ) ||
      !Types.ObjectId.isValid(
        normalizedProjectId,
      )
    ) {
      throw new Error(
        'Thread attachment deletion context is invalid.',
      );
    }

    const threadObjectId =
      new Types.ObjectId(
        normalizedThreadId,
      );

    const projectObjectId =
      new Types.ObjectId(
        normalizedProjectId,
      );

    /*
     * Capture every attachment pointer before the ThreadMessage documents
     * disappear.
     *
     * Modern attachments update their existing durable registry row.
     * Historical attachments receive a synthetic registry row so physical
     * cleanup remains retryable after deleteMany().
     */
    const messages: any[] =
      await this.messageModel
        .find({
          threadId:
            threadObjectId,
        })
        .select({
          _id: 1,
          threadId: 1,
          userId: 1,
          attachments: 1,
        })
        .lean()
        .exec();

    const now =
      new Date();

    try {
      for (
        const message
        of messages
      ) {
        const messageId =
          String(
            message?._id ||
            '',
          ).trim();

        const uploaderId =
          String(
            message?.userId ||
            '',
          ).trim();

        if (
          !Types.ObjectId.isValid(
            messageId,
          ) ||
          !Types.ObjectId.isValid(
            uploaderId,
          )
        ) {
          throw new Error(
            'Thread message attachment context is invalid.',
          );
        }

        const messageObjectId =
          new Types.ObjectId(
            messageId,
          );

        const uploaderObjectId =
          new Types.ObjectId(
            uploaderId,
          );

        const attachments =
          Array.isArray(
            message?.attachments,
          )
            ? message.attachments
            : [];

        for (
          let index = 0;
          index < attachments.length;
          index += 1
        ) {
          const attachment: any =
            attachments[index];

          const rawFileId =
            String(
              attachment
                ?.fileId ||
              '',
            ).trim();

          /*
           * Use the same deterministic fallback as explicit single-message
           * deletion so both deletion paths refer to one logical legacy asset.
           */
          const registryFileId =
            rawFileId ||
            [
              'legacy-message',
              messageId,
              String(index),
            ].join(':');

          const fileName =
            String(
              attachment
                ?.fileName ||
              attachment
                ?.name ||
              'attachment',
            );

          const fileUrl =
            String(
              attachment
                ?.fileUrl ||
              attachment
                ?.url ||
              '',
            ).trim();

          const mimeType =
            String(
              attachment
                ?.mimeType ||
              attachment
                ?.mime ||
              '',
            ).trim();

          const sizeInBytes =
            Math.max(
              0,
              Number(
                attachment
                  ?.fileSize ??
                attachment
                  ?.size ??
                0,
              ),
            );

          const thumbnailUrl =
            String(
              attachment
                ?.thumbnailUrl ||
              attachment
                ?.thumbUrl ||
              '',
            ).trim();

          await this.assetModel
            .updateOne(
              {
                fileId:
                  registryFileId,

                projectId:
                  projectObjectId,

                threadId:
                  threadObjectId,

                uploaderId:
                  uploaderObjectId,

                consumedMessageId:
                  messageObjectId,
              },
              {
                $set: {
                  deletionRequestedAt:
                    now,

                  deletionReason:
                    'thread_delete',
                },

                $setOnInsert: {
                  fileName,

                  fileUrl,

                  mimeType,

                  sizeInBytes,

                  thumbnailUrl,

                  storageProvider:
                    '',

                  storageKey:
                    '',

                  expiresAt:
                    now,

                  consumedAt:
                    now,

                  legacyBackfill:
                    true,
                },
              },
              {
                upsert:
                  true,
              },
            )
            .exec();
        }
      }
    } catch (error) {
      /*
       * The thread/messages still exist because staging is called before
       * deleteMany(). Reconciliation therefore rolls the requests back without
       * deleting any physical attachment.
       */
      try {
        await this
          .reconcileDeletionRequestsForThread(
            normalizedThreadId,
          );
      } catch (
        rollbackError
      ) {
        this.logger.error(
          [
            'Failed to roll back Team Room thread attachment deletion staging',
            `threadId=${normalizedThreadId}`,
            rollbackError instanceof Error
              ? rollbackError.message
              : String(
                  rollbackError,
                ),
          ].join(' '),
        );
      }

      throw error;
    }
  }

  async reconcileDeletionRequestsForThread(
    threadId: string,
  ): Promise<void> {
    await this
      .reconcileDeletionRequests(
        undefined,
        threadId,
      );
  }

  async reconcileDeletionRequestsForMessage(
    messageId: string,
  ): Promise<void> {
    await this
      .reconcileDeletionRequests(
        messageId,
      );
  }

  private async reconcileDeletionRequests(
    messageId?: string,
    threadId?: string,
  ): Promise<void> {
    const query: any = {
      deletionRequestedAt: {
        $ne:
          null,
      },
    };

    if (
      String(
        messageId ||
        '',
      ).trim()
    ) {
      query.consumedMessageId =
        String(
          messageId,
        ).trim();
    }

    if (
      String(
        threadId ||
        '',
      ).trim()
    ) {
      query.threadId =
        String(
          threadId,
        ).trim();
    }

    const assets =
      await this.assetModel
        .find(
          query,
        )
        .sort({
          deletionRequestedAt:
            1,
        })
        .limit(100)
        .lean()
        .exec();

    for (
      const asset
      of assets
    ) {
      try {
        const claimedMessageId =
          asset
            ?.consumedMessageId;

        /*
         * Explicit deletion requests are only meaningful for assets that were
         * attached to a durable message.
         *
         * If malformed metadata somehow reaches this state, fail safe by
         * clearing the delete request rather than deleting an object.
         */
        if (
          !claimedMessageId
        ) {
          await this.assetModel
            .updateOne(
              {
                _id:
                  asset._id,

                deletionRequestedAt: {
                  $ne:
                    null,
                },
              },
              {
                $set: {
                  deletionRequestedAt:
                    null,

                  deletionReason:
                    '',
                },
              },
            )
            .exec();

          continue;
        }

        const message =
          await this.messageModel
            .findById(
              claimedMessageId,
            )
            .select({
              _id: 1,
            })
            .lean()
            .exec();

        if (message) {
          /*
           * The database message still exists, so the user-facing delete did
           * not complete.
           *
           * Never delete the physical object in this state.
           *
           * A legacyBackfill row is synthetic and should disappear so the
           * still-existing message returns to historical fallback accounting.
           * A modern registry row remains, but its deletion request is reset.
           */
          if (
            Boolean(
              asset
                ?.legacyBackfill,
            )
          ) {
            await this.assetModel
              .deleteOne({
                _id:
                  asset._id,

                deletionRequestedAt: {
                  $ne:
                    null,
                },

                legacyBackfill:
                  true,
              })
              .exec();
          } else {
            await this.assetModel
              .updateOne(
                {
                  _id:
                    asset._id,

                  deletionRequestedAt: {
                    $ne:
                      null,
                  },
                },
                {
                  $set: {
                    deletionRequestedAt:
                      null,

                    deletionReason:
                      '',
                  },
                },
              )
              .exec();
          }

          continue;
        }

        /*
         * The message is gone. The user's explicit deletion therefore
         * completed and this storage object can now be removed.
         *
         * Physical object first. Metadata second.
         */
        await this.uploadsService
          .deleteStoredObject({
            url:
              String(
                asset?.fileUrl ||
                '',
              ),

            storageProvider:
              String(
                asset
                  ?.storageProvider ||
                '',
              ),

            storageKey:
              String(
                asset
                  ?.storageKey ||
                '',
              ),
          });

        await this.assetModel
          .deleteOne({
            _id:
              asset._id,

            consumedMessageId:
              claimedMessageId,

            deletionRequestedAt: {
              $ne:
                null,
            },
          })
          .exec();
      } catch (error) {
        /*
         * Keep metadata when physical cleanup fails. That preserves:
         *
         * - authoritative storage accounting
         * - retry information
         * - the physical-object locator
         */
        this.logger.error(
          [
            'Team Room explicit deletion cleanup failed',
            `assetId=${String(
              asset?._id ||
              '',
            )}`,
            error instanceof Error
              ? error.message
              : String(error),
          ].join(' '),
        );
      }
    }
  }

  private async reconcileExpiredClaims(
    now: Date,
  ): Promise<void> {
    /*
     * A claim can remain unfinished if the process dies after:
     *
     *   asset claim
     *       ↓
     *   message.save()
     *       ↓
     *   consumedAt finalization
     *
     * We deliberately wait until expiresAt before reconciling so an
     * otherwise-valid receipt/asset window is never released early.
     */
    const assets =
      await this.assetModel
        .find({
          consumedMessageId: {
            $ne: null,
          },

          consumedAt:
            null,

          expiresAt: {
            $lte:
              now,
          },
        })
        .sort({
          expiresAt: 1,
        })
        .limit(100)
        .lean()
        .exec();

    for (
      const asset
      of assets
    ) {
      try {
        const claimedMessageId =
          asset
            ?.consumedMessageId;

        if (!claimedMessageId) {
          continue;
        }

        const message: any =
          await this.messageModel
            .findById(
              claimedMessageId,
            )
            .select({
              _id: 1,
              attachments: 1,
            })
            .lean()
            .exec();

        const fileId =
          String(
            asset?.fileId ||
            '',
          ).trim();

        const messageContainsAsset =
          Boolean(
            message &&
            Array.isArray(
              message.attachments,
            ) &&
            message.attachments
              .some(
                (
                  attachment:
                    any,
                ) =>
                  String(
                    attachment
                      ?.fileId ||
                    '',
                  ).trim() ===
                  fileId,
              ),
          );

        if (
          messageContainsAsset
        ) {
          /*
           * Message save succeeded but consumption finalization did not.
           * Repair metadata only. Never touch the physical object.
           */
          await this.assetModel
            .updateOne(
              {
                _id:
                  asset._id,

                consumedMessageId:
                  claimedMessageId,

                consumedAt:
                  null,
              },
              {
                $set: {
                  consumedAt:
                    now,
                },
              },
            )
            .exec();

          continue;
        }

        /*
         * No matching durable message exists. The claim is abandoned.
         * Release it; because expiresAt has already passed, the second
         * cleanup pass below may then remove the unused physical object.
         */
        await this.assetModel
          .updateOne(
            {
              _id:
                asset._id,

              consumedMessageId:
                claimedMessageId,

              consumedAt:
                null,
            },
            {
              $set: {
                consumedMessageId:
                  null,
              },
            },
          )
          .exec();
      } catch (error) {
        this.logger.error(
          [
            'Team Room claim reconciliation failed',
            `assetId=${String(
              asset?._id ||
              '',
            )}`,
            error instanceof Error
              ? error.message
              : String(error),
          ].join(' '),
        );
      }
    }
  }

  private async cleanupExpiredUnconsumedUploads(
    now: Date,
  ): Promise<void> {
    const assets =
      await this.assetModel
        .find({
          consumedMessageId:
            null,

          consumedAt:
            null,

          expiresAt: {
            $lte:
              now,
          },
        })
        .sort({
          expiresAt: 1,
        })
        .limit(100)
        .lean()
        .exec();

    for (
      const asset
      of assets
    ) {
      try {
        /*
         * Physical object first.
         *
         * If this throws, the metadata remains in Mongo so:
         * - storage remains accounted,
         * - the next cron run can retry,
         * - we never lose the pointer to an undeleted managed object.
         */
        await this.uploadsService
          .deleteStoredObject({
            url:
              String(
                asset?.fileUrl ||
                '',
              ),

            storageProvider:
              String(
                asset
                  ?.storageProvider ||
                '',
              ),

            storageKey:
              String(
                asset
                  ?.storageKey ||
                '',
              ),
          });

        /*
         * An expired, unconsumed asset cannot be newly claimed because the
         * message claim path requires expiresAt > now. Still include the
         * lifecycle fields in the delete filter as a fail-safe.
         */
        await this.assetModel
          .deleteOne({
            _id:
              asset._id,

            consumedMessageId:
              null,

            consumedAt:
              null,

            expiresAt: {
              $lte:
                now,
            },
          })
          .exec();
      } catch (error) {
        this.logger.error(
          [
            'Team Room expired upload cleanup failed',
            `assetId=${String(
              asset?._id ||
              '',
            )}`,
            error instanceof Error
              ? error.message
              : String(error),
          ].join(' '),
        );
      }
    }
  }
}
