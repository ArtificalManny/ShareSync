import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  Types,
} from 'mongoose';

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum ApprovalSourceType {
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
export class Approval {
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
  request: string;

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
  approverId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ApprovalStatus,
    default: ApprovalStatus.PENDING,
    index: true,
  })
  status: ApprovalStatus;

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
  decidedBy?: Types.ObjectId | null;

  @Prop({
    type: Date,
    default: null,
  })
  decidedAt?: Date | null;

  @Prop({
    type: Date,
    default: null,
  })
  cancelledAt?: Date | null;

  @Prop({
    type: String,
    enum: ApprovalSourceType,
    default: ApprovalSourceType.PROJECT,
    index: true,
  })
  sourceType: ApprovalSourceType;

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

export type ApprovalDocument =
  HydratedDocument<Approval>;

export const ApprovalSchema =
  SchemaFactory.createForClass(
    Approval,
  );

ApprovalSchema.index({
  projectId: 1,
  status: 1,
  createdAt: -1,
});

ApprovalSchema.index({
  approverId: 1,
  status: 1,
  createdAt: -1,
});

ApprovalSchema.index({
  requestedBy: 1,
  createdAt: -1,
});
