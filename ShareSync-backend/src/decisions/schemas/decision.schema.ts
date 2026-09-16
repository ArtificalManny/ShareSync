import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';
import {
  Document,
  Types,
} from 'mongoose';

export enum DecisionStatus {
  ACTIVE = 'active',
  SUPERSEDED = 'superseded',
}

export enum DecisionSourceType {
  PROJECT = 'project',
  MOVE = 'move',
  DISCUSSION = 'discussion',
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
export class Decision {
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
  decision: string;

  @Prop({
    default: '',
    trim: true,
    maxlength: 10000,
  })
  rationale: string;

  @Prop({
    type: String,
    enum: Object.values(DecisionStatus),
    default: DecisionStatus.ACTIVE,
    index: true,
  })
  status: DecisionStatus;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  decidedBy: Types.ObjectId;

  @Prop({
    type: Date,
    default: Date.now,
    index: true,
  })
  decidedAt: Date;

  @Prop({
    type: String,
    enum: Object.values(DecisionSourceType),
    default: DecisionSourceType.PROJECT,
  })
  sourceType: DecisionSourceType;

  @Prop({
    type: Types.ObjectId,
    ref: 'Task',
    default: null,
    index: true,
  })
  sourceMoveId?: Types.ObjectId | null;

  @Prop({
    type: Types.ObjectId,
    ref: 'Thread',
    default: null,
  })
  sourceThreadId?: Types.ObjectId | null;

  @Prop({
    type: Types.ObjectId,
    ref: 'ThreadMessage',
    default: null,
  })
  sourceMessageId?: Types.ObjectId | null;
}

export type DecisionDocument =
  Decision & Document;

export const DecisionSchema =
  SchemaFactory.createForClass(
    Decision,
  );

DecisionSchema.index({
  projectId: 1,
  decidedAt: -1,
});

DecisionSchema.index({
  projectId: 1,
  status: 1,
  decidedAt: -1,
});
