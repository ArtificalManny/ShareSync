import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  Document,
  Types,
} from 'mongoose';

export enum CommitmentStatus {
  ACTIVE = 'active',
  FULFILLED = 'fulfilled',
  CANCELLED = 'cancelled',
}

export enum CommitmentSourceType {
  PROJECT = 'project',
  MOVE = 'move',
}

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_: any, ret: any) => {
      ret.id = ret._id?.toString();
      delete ret.__v;
      return ret;
    },
  },
})
export class Commitment {
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
    maxlength: 300,
  })
  title: string;

  @Prop({
    required: true,
    trim: true,
    maxlength: 5000,
  })
  commitment: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  ownerId: Types.ObjectId;

  @Prop({
    type: Date,
    required: true,
    index: true,
  })
  dueAt: Date;

  @Prop({
    type: String,
    enum: Object.values(
      CommitmentStatus,
    ),
    default:
      CommitmentStatus.ACTIVE,
    index: true,
  })
  status: CommitmentStatus;

  @Prop({
    type: Date,
    default: null,
  })
  fulfilledAt?: Date | null;

  @Prop({
    type: Date,
    default: null,
  })
  cancelledAt?: Date | null;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  createdBy: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(
      CommitmentSourceType,
    ),
    default:
      CommitmentSourceType.PROJECT,
  })
  sourceType:
    CommitmentSourceType;

  @Prop({
    type: Types.ObjectId,
    ref: 'Task',
    default: null,
    index: true,
  })
  sourceMoveId?:
    Types.ObjectId | null;
}

export type CommitmentDocument =
  Commitment & Document;

export const CommitmentSchema =
  SchemaFactory.createForClass(
    Commitment,
  );

CommitmentSchema.index({
  projectId: 1,
  status: 1,
  dueAt: 1,
});

CommitmentSchema.index({
  ownerId: 1,
  status: 1,
  dueAt: 1,
});

CommitmentSchema.index({
  projectId: 1,
  sourceMoveId: 1,
  createdAt: -1,
});
