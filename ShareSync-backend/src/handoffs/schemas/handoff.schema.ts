import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  Types,
} from 'mongoose';

export enum HandoffStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  CANCELLED = 'cancelled',
}

export enum HandoffSourceType {
  PROJECT = 'project',
  MOVE = 'move',
}

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret) => {
      (ret as any).id =
        (ret as any)._id;

      delete (ret as any).__v;

      return ret;
    },
  },
})
export class Handoff {
  @Prop({
    type: Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true,
  })
  projectId: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
    maxlength: 180,
  })
  title: string;

  @Prop({
    required: true,
    trim: true,
    maxlength: 4000,
  })
  context: string;

  @Prop({
    type: String,
    trim: true,
    maxlength: 4000,
    default: null,
  })
  acceptanceCriteria?: string | null;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  requestedBy: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  recipientId: Types.ObjectId;

  @Prop({
    type: String,
    enum: HandoffStatus,
    default: HandoffStatus.PENDING,
    index: true,
  })
  status: HandoffStatus;

  @Prop({
    type: String,
    trim: true,
    maxlength: 4000,
    default: null,
  })
  responseNote?: string | null;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    default: null,
  })
  respondedBy?: Types.ObjectId | null;

  @Prop({
    type: Date,
    default: null,
  })
  acceptedAt?: Date | null;

  @Prop({
    type: Date,
    default: null,
  })
  declinedAt?: Date | null;

  @Prop({
    type: Date,
    default: null,
  })
  cancelledAt?: Date | null;

  @Prop({
    type: String,
    enum: HandoffSourceType,
    default: HandoffSourceType.PROJECT,
    index: true,
  })
  sourceType: HandoffSourceType;

  @Prop({
    type: Types.ObjectId,
    ref: 'Task',
    default: null,
    index: true,
  })
  sourceMoveId?: Types.ObjectId | null;

  createdAt: Date;
  updatedAt: Date;
}

export type HandoffDocument =
  HydratedDocument<Handoff>;

export const HandoffSchema =
  SchemaFactory.createForClass(
    Handoff,
  );

HandoffSchema.index({
  projectId: 1,
  status: 1,
  createdAt: -1,
});

HandoffSchema.index({
  recipientId: 1,
  status: 1,
  createdAt: -1,
});

HandoffSchema.index({
  requestedBy: 1,
  createdAt: -1,
});

HandoffSchema.index({
  sourceMoveId: 1,
  createdAt: -1,
});
