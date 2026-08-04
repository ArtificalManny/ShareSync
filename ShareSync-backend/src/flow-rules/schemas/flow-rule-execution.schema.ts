import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';
import {
  HydratedDocument,
  Types,
} from 'mongoose';

export enum FlowRuleExecutionStatus {
  RUNNING = 'running',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
}

export type FlowRuleExecutionDocument =
  HydratedDocument<FlowRuleExecution>;

@Schema({
  collection: 'flow_rule_executions',
  timestamps: true,
})
export class FlowRuleExecution {
  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'Project',
    index: true,
  })
  projectId: Types.ObjectId;

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'FlowRule',
    index: true,
  })
  ruleId: Types.ObjectId;

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'Task',
    index: true,
  })
  taskId: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
    maxlength: 100,
  })
  triggerType: string;

  @Prop({
    required: true,
    trim: true,
    maxlength: 100,
  })
  eventType: string;

  @Prop({
    required: true,
    trim: true,
    maxlength: 100,
    index: true,
  })
  correlationId: string;

  @Prop({
    required: true,
    min: 0,
    max: 20,
  })
  depth: number;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    default: null,
  })
  actorId?: Types.ObjectId | null;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    default: null,
  })
  executionUserId?: Types.ObjectId | null;

  @Prop({
    required: true,
    type: String,
    enum: Object.values(FlowRuleExecutionStatus),
    index: true,
  })
  status: FlowRuleExecutionStatus;

  @Prop({
    default: 0,
    min: 0,
  })
  matchedConditionCount: number;

  @Prop({
    default: 0,
    min: 0,
  })
  actionCount: number;

  @Prop({
    type: String,
    trim: true,
    maxlength: 1000,
    default: '',
  })
  error: string;

  @Prop({
    required: true,
    type: Date,
  })
  startedAt: Date;

  @Prop({
    type: Date,
    default: null,
  })
  completedAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const FlowRuleExecutionSchema =
  SchemaFactory.createForClass(
    FlowRuleExecution,
  );

FlowRuleExecutionSchema.index(
  {
    correlationId: 1,
    ruleId: 1,
    taskId: 1,
  },
  {
    unique: true,
  },
);

FlowRuleExecutionSchema.index({
  projectId: 1,
  ruleId: 1,
  createdAt: -1,
});
