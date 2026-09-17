import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  Types,
} from 'mongoose';

export enum AsyncCheckInStatus {
  OPEN = 'open',
  CLOSED = 'closed',
}

@Schema({
  timestamps: true,
  collection: 'async_check_ins',
})
export class AsyncCheckIn {
  @Prop({
    type: Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true,
  })
  projectId: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    trim: true,
    maxlength: 140,
  })
  title: string;

  @Prop({
    type: String,
    default: '',
    trim: true,
    maxlength: 1000,
  })
  prompt: string;

  @Prop({
    type: String,
    enum: AsyncCheckInStatus,
    default: AsyncCheckInStatus.OPEN,
    required: true,
  })
  status: AsyncCheckInStatus;

  @Prop({
    type: Date,
    default: null,
  })
  dueAt?: Date | null;

  @Prop({
    type: [
      {
        type: Types.ObjectId,
        ref: 'User',
      },
    ],
    default: [],
    required: true,
  })
  participantIds: Types.ObjectId[];

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  createdBy: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    default: null,
  })
  closedBy?: Types.ObjectId | null;

  @Prop({
    type: Date,
    default: null,
  })
  closedAt?: Date | null;
}

export type AsyncCheckInDocument =
  HydratedDocument<AsyncCheckIn>;

export const AsyncCheckInSchema =
  SchemaFactory.createForClass(
    AsyncCheckIn,
  );

AsyncCheckInSchema.index({
  projectId: 1,
  createdAt: -1,
});

AsyncCheckInSchema.index({
  projectId: 1,
  status: 1,
  dueAt: 1,
});
