import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';
import {
  HydratedDocument,
  Types,
} from 'mongoose';

export enum FlowRuleTriggerType {
  TASK_CREATED = 'task.created',
  TASK_STATUS_CHANGED = 'task.status_changed',
  TASK_PRIORITY_CHANGED = 'task.priority_changed',
}

export enum FlowRuleConditionField {
  PRIORITY = 'priority',
  STATUS = 'status',
  ASSIGNEE_ID = 'assigneeId',
}

export enum FlowRuleConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  IS_EMPTY = 'is_empty',
  IS_NOT_EMPTY = 'is_not_empty',
}

export enum FlowRuleActionType {
  ASSIGN_TASK = 'task.assign',
  SET_PRIORITY = 'task.set_priority',
  SET_STATUS = 'task.set_status',
  SEND_PROJECT_NOTIFICATION = 'notification.project',
}

@Schema({
  _id: false,
})
export class FlowRuleCondition {
  @Prop({
    required: true,
    type: String,
    enum: Object.values(FlowRuleConditionField),
  })
  field: FlowRuleConditionField;

  @Prop({
    required: true,
    type: String,
    enum: Object.values(FlowRuleConditionOperator),
  })
  operator: FlowRuleConditionOperator;

  @Prop({
    type: String,
    trim: true,
    maxlength: 200,
  })
  value?: string;
}

export const FlowRuleConditionSchema =
  SchemaFactory.createForClass(FlowRuleCondition);

@Schema({
  _id: false,
})
export class FlowRuleAction {
  @Prop({
    required: true,
    type: String,
    enum: Object.values(FlowRuleActionType),
  })
  type: FlowRuleActionType;

  @Prop({
    type: String,
    trim: true,
    maxlength: 200,
  })
  value?: string;

  @Prop({
    type: String,
    trim: true,
    maxlength: 500,
  })
  message?: string;
}

export const FlowRuleActionSchema =
  SchemaFactory.createForClass(FlowRuleAction);

export type FlowRuleDocument =
  HydratedDocument<FlowRule>;

@Schema({
  collection: 'flow_rules',
  timestamps: true,
})
export class FlowRule {
  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'Project',
    index: true,
  })
  projectId: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 120,
  })
  name: string;

  @Prop({
    default: '',
    trim: true,
    maxlength: 500,
  })
  description: string;

  @Prop({
    required: true,
    type: String,
    enum: Object.values(FlowRuleTriggerType),
  })
  triggerType: FlowRuleTriggerType;

  @Prop({
    type: [FlowRuleConditionSchema],
    default: [],
  })
  conditions: FlowRuleCondition[];

  @Prop({
    type: [FlowRuleActionSchema],
    required: true,
    default: [],
  })
  actions: FlowRuleAction[];

  @Prop({
    default: true,
    index: true,
  })
  enabled: boolean;

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'User',
  })
  createdBy: Types.ObjectId;

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'User',
  })
  updatedBy: Types.ObjectId;

  @Prop({
    default: 0,
    min: 0,
  })
  executionCount: number;

  @Prop({
    default: 0,
    min: 0,
  })
  failureCount: number;

  @Prop({
    type: Date,
    default: null,
  })
  lastTriggeredAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const FlowRuleSchema =
  SchemaFactory.createForClass(FlowRule);

FlowRuleSchema.index({
  projectId: 1,
  createdAt: -1,
});

FlowRuleSchema.index({
  projectId: 1,
  enabled: 1,
  triggerType: 1,
});
