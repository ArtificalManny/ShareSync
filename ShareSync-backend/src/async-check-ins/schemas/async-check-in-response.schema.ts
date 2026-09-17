import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  Types,
} from 'mongoose';

export enum AsyncCheckInHealth {
  ON_TRACK = 'on_track',
  AT_RISK = 'at_risk',
  BLOCKED = 'blocked',
}

@Schema({
  timestamps: true,
  collection: 'async_check_in_responses',
})
export class AsyncCheckInResponse {
  @Prop({
    type: Types.ObjectId,
    ref: 'AsyncCheckIn',
    required: true,
    index: true,
  })
  checkInId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true,
  })
  projectId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: AsyncCheckInHealth,
    required: true,
  })
  health: AsyncCheckInHealth;

  @Prop({
    type: String,
    required: true,
    trim: true,
    maxlength: 2000,
  })
  progress: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
    maxlength: 2000,
  })
  next: string;

  @Prop({
    type: String,
    default: '',
    trim: true,
    maxlength: 2000,
  })
  blockers: string;

  @Prop({
    type: Date,
    required: true,
    default: Date.now,
  })
  submittedAt: Date;
}

export type AsyncCheckInResponseDocument =
  HydratedDocument<AsyncCheckInResponse>;

export const AsyncCheckInResponseSchema =
  SchemaFactory.createForClass(
    AsyncCheckInResponse,
  );

AsyncCheckInResponseSchema.index(
  {
    checkInId: 1,
    userId: 1,
  },
  {
    unique: true,
  },
);

AsyncCheckInResponseSchema.index({
  projectId: 1,
  checkInId: 1,
  createdAt: 1,
});
