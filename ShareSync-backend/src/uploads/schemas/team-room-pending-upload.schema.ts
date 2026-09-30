import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';
import {
  Document,
  Types,
} from 'mongoose';

// openshare-team-room-storage-accounting-v1
@Schema({
  timestamps: true,
})
export class TeamRoomPendingUpload {
  @Prop({
    required: true,
    unique: true,
    index: true,
  })
  fileId: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true,
  })
  projectId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Thread',
    required: true,
    index: true,
  })
  threadId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  uploaderId: Types.ObjectId;

  @Prop({
    required: true,
  })
  fileName: string;

  @Prop({
    required: true,
  })
  fileUrl: string;

  @Prop({
    default: '',
  })
  mimeType: string;

  @Prop({
    required: true,
    min: 0,
  })
  sizeInBytes: number;

  @Prop({
    default: '',
  })
  thumbnailUrl: string;

  @Prop({
    default: '',
  })
  storageProvider: string;

  @Prop({
    default: '',
  })
  storageKey: string;

  @Prop({
    type: Date,
    required: true,
    index: true,
  })
  expiresAt: Date;

  // openshare-team-room-asset-registry-v1
  // The upload row remains after consumption so storage accounting and
  // physical-object deletion have one durable server-side source of truth.
  //
  // consumedMessageId may also act as the short-lived atomic claim while a
  // message is being persisted. consumedAt is set only after message.save().
  @Prop({
    type: Types.ObjectId,
    ref: 'ThreadMessage',
    default: null,
    index: true,
  })
  consumedMessageId:
    | Types.ObjectId
    | null;

  @Prop({
    type: Date,
    default: null,
    index: true,
  })
  consumedAt:
    | Date
    | null;

  // openshare-team-room-explicit-delete-retry-v1
  @Prop({
    type: Date,
    default: null,
    index: true,
  })
  deletionRequestedAt:
    | Date
    | null;

  @Prop({
    default: '',
  })
  deletionReason: string;

  /*
   * Older Team Room attachments may predate the durable asset registry.
   * Before an explicit message/thread deletion, a synthetic registry row can
   * preserve their physical-object pointer until cleanup succeeds.
   */
  @Prop({
    default: false,
  })
  legacyBackfill: boolean;
}

export type TeamRoomPendingUploadDocument =
  TeamRoomPendingUpload &
  Document;

export const TeamRoomPendingUploadSchema =
  SchemaFactory.createForClass(
    TeamRoomPendingUpload,
  );

TeamRoomPendingUploadSchema.index({
  projectId: 1,
  createdAt: 1,
});

TeamRoomPendingUploadSchema.index({
  threadId: 1,
  createdAt: 1,
});

// openshare-team-room-upload-cleanup-v1
TeamRoomPendingUploadSchema.index({
  expiresAt: 1,
  consumedMessageId: 1,
  consumedAt: 1,
});

TeamRoomPendingUploadSchema.index({
  consumedMessageId: 1,
  consumedAt: 1,
  expiresAt: 1,
});

TeamRoomPendingUploadSchema.index({
  deletionRequestedAt: 1,
  consumedMessageId: 1,
});

// Do NOT add expireAfterSeconds here.
// Physical object cleanup must happen before metadata deletion.
