import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InjectModel,
} from '@nestjs/mongoose';
import {
  Model,
  Types,
} from 'mongoose';

import {
  TaskPriority,
  TaskStatus,
} from '../tasks/schemas/task.schema';

import {
  CreateFlowRuleDto,
  FlowRuleActionDto,
  FlowRuleConditionDto,
} from './dto/create-flow-rule.dto';
import {
  UpdateFlowRuleDto,
} from './dto/update-flow-rule.dto';
import {
  FlowRuleExecution,
  FlowRuleExecutionDocument,
  FlowRuleExecutionStatus,
} from './schemas/flow-rule-execution.schema';
import {
  FlowRule,
  FlowRuleActionType,
  FlowRuleConditionField,
  FlowRuleConditionOperator,
  FlowRuleDocument,
  FlowRuleTriggerType,
} from './schemas/flow-rule.schema';

type ClaimExecutionInput = {
  projectId: string;
  ruleId: string;
  taskId: string;
  triggerType: string;
  eventType: string;
  correlationId: string;
  depth: number;
  actorId?: string;
  executionUserId?: string;
  matchedConditionCount: number;
};

@Injectable()
export class FlowRulesService {
  private readonly maximumRulesPerProject = 50;

  constructor(
    @InjectModel(FlowRule.name)
    private readonly flowRuleModel:
      Model<FlowRuleDocument>,

    @InjectModel(FlowRuleExecution.name)
    private readonly executionModel:
      Model<FlowRuleExecutionDocument>,
  ) {}

  async list(projectId: string) {
    return this.flowRuleModel
      .find({
        projectId: this.toObjectId(
          projectId,
          'projectId',
        ),
      })
      .sort({
        createdAt: -1,
      })
      .select('-__v')
      .lean()
      .exec();
  }

  async findEnabledByTriggers(
    projectId: string,
    triggerTypes: FlowRuleTriggerType[],
  ) {
    if (
      !Array.isArray(triggerTypes) ||
      triggerTypes.length === 0
    ) {
      return [];
    }

    return this.flowRuleModel
      .find({
        projectId: this.toObjectId(
          projectId,
          'projectId',
        ),
        enabled: true,
        triggerType: {
          $in: triggerTypes,
        },
      })
      .sort({
        createdAt: 1,
      })
      .lean()
      .exec();
  }

  async findOne(
    projectId: string,
    ruleId: string,
  ) {
    const rule = await this.findDocument(
      projectId,
      ruleId,
    );

    return rule.toObject();
  }

  async listExecutions(
    projectId: string,
    ruleId: string,
  ) {
    await this.findDocument(
      projectId,
      ruleId,
    );

    return this.executionModel
      .find({
        projectId: this.toObjectId(
          projectId,
          'projectId',
        ),
        ruleId: this.toObjectId(
          ruleId,
          'ruleId',
        ),
      })
      .sort({
        createdAt: -1,
      })
      .limit(50)
      .select('-__v')
      .lean()
      .exec();
  }

  async create(
    projectId: string,
    userId: string,
    dto: CreateFlowRuleDto,
  ) {
    const normalizedProjectId =
      this.toObjectId(
        projectId,
        'projectId',
      );

    const normalizedUserId =
      this.toObjectId(userId, 'userId');

    const currentRuleCount =
      await this.flowRuleModel
        .countDocuments({
          projectId: normalizedProjectId,
        });

    if (
      currentRuleCount >=
      this.maximumRulesPerProject
    ) {
      throw new BadRequestException(
        `A project can have at most ` +
          `${this.maximumRulesPerProject} ` +
          `Flow Rules.`,
      );
    }

    const conditions =
      this.normalizeConditions(
        dto.conditions || [],
      );

    const actions =
      this.normalizeActions(dto.actions);

    this.validateDefinition(
      conditions,
      actions,
    );

    const rule =
      await this.flowRuleModel.create({
        projectId: normalizedProjectId,
        name: dto.name.trim(),
        description:
          dto.description?.trim() || '',
        triggerType: dto.triggerType,
        conditions,
        actions,
        enabled: dto.enabled ?? true,
        createdBy: normalizedUserId,
        updatedBy: normalizedUserId,
        executionCount: 0,
        failureCount: 0,
        lastTriggeredAt: null,
      });

    return rule.toObject();
  }

  async update(
    projectId: string,
    ruleId: string,
    userId: string,
    dto: UpdateFlowRuleDto,
  ) {
    const rule = await this.findDocument(
      projectId,
      ruleId,
    );

    const nextConditions =
      dto.conditions !== undefined
        ? this.normalizeConditions(
            dto.conditions,
          )
        : (rule.conditions as any);

    const nextActions =
      dto.actions !== undefined
        ? this.normalizeActions(dto.actions)
        : (rule.actions as any);

    this.validateDefinition(
      nextConditions,
      nextActions,
    );

    if (dto.name !== undefined) {
      rule.name = dto.name.trim();
    }

    if (dto.description !== undefined) {
      rule.description =
        dto.description.trim();
    }

    if (dto.triggerType !== undefined) {
      rule.triggerType =
        dto.triggerType;
    }

    if (dto.conditions !== undefined) {
      rule.conditions =
        nextConditions as any;
    }

    if (dto.actions !== undefined) {
      rule.actions =
        nextActions as any;
    }

    if (dto.enabled !== undefined) {
      rule.enabled = dto.enabled;
    }

    rule.updatedBy =
      this.toObjectId(userId, 'userId');

    await rule.save();

    return rule.toObject();
  }

  async setEnabled(
    projectId: string,
    ruleId: string,
    userId: string,
    enabled: boolean,
  ) {
    const rule = await this.findDocument(
      projectId,
      ruleId,
    );

    rule.enabled = enabled;
    rule.updatedBy =
      this.toObjectId(userId, 'userId');

    await rule.save();

    return rule.toObject();
  }

  async remove(
    projectId: string,
    ruleId: string,
  ): Promise<void> {
    const rule = await this.findDocument(
      projectId,
      ruleId,
    );

    await this.executionModel.deleteMany({
      projectId: this.toObjectId(
        projectId,
        'projectId',
      ),
      ruleId: this.toObjectId(
        ruleId,
        'ruleId',
      ),
    });

    await rule.deleteOne();
  }

  async claimExecution(
    input: ClaimExecutionInput,
  ) {
    try {
      const execution =
        await this.executionModel.create({
          projectId: this.toObjectId(
            input.projectId,
            'projectId',
          ),
          ruleId: this.toObjectId(
            input.ruleId,
            'ruleId',
          ),
          taskId: this.toObjectId(
            input.taskId,
            'taskId',
          ),
          triggerType:
            input.triggerType,
          eventType: input.eventType,
          correlationId:
            input.correlationId,
          depth: input.depth,
          actorId:
            this.optionalObjectId(
              input.actorId,
            ),
          executionUserId:
            this.optionalObjectId(
              input.executionUserId,
            ),
          status:
            FlowRuleExecutionStatus.RUNNING,
          matchedConditionCount:
            input.matchedConditionCount,
          actionCount: 0,
          error: '',
          startedAt: new Date(),
          completedAt: null,
        });

      return execution.toObject();
    } catch (error: any) {
      if (
        error?.code === 11000 ||
        error?.codeName ===
          'DuplicateKey'
      ) {
        return null;
      }

      throw error;
    }
  }

  async completeExecution(
    executionId: string,
    ruleId: string,
    actionCount: number,
  ): Promise<void> {
    const completedAt = new Date();

    await this.executionModel.updateOne(
      {
        _id: this.toObjectId(
          executionId,
          'executionId',
        ),
      },
      {
        $set: {
          status:
            FlowRuleExecutionStatus
              .SUCCEEDED,
          actionCount,
          completedAt,
          error: '',
        },
      },
    );

    await this.flowRuleModel.updateOne(
      {
        _id: this.toObjectId(
          ruleId,
          'ruleId',
        ),
      },
      {
        $inc: {
          executionCount: 1,
        },
        $set: {
          lastTriggeredAt: completedAt,
        },
      },
    );
  }

  async failExecution(
    executionId: string,
    ruleId: string,
    errorMessage: string,
  ): Promise<void> {
    const completedAt = new Date();

    await this.executionModel.updateOne(
      {
        _id: this.toObjectId(
          executionId,
          'executionId',
        ),
      },
      {
        $set: {
          status:
            FlowRuleExecutionStatus.FAILED,
          completedAt,
          error: String(
            errorMessage || 'Unknown error',
          ).slice(0, 1000),
        },
      },
    );

    await this.flowRuleModel.updateOne(
      {
        _id: this.toObjectId(
          ruleId,
          'ruleId',
        ),
      },
      {
        $inc: {
          executionCount: 1,
          failureCount: 1,
        },
        $set: {
          lastTriggeredAt: completedAt,
        },
      },
    );
  }

  private async findDocument(
    projectId: string,
    ruleId: string,
  ): Promise<FlowRuleDocument> {
    const rule =
      await this.flowRuleModel
        .findOne({
          _id: this.toObjectId(
            ruleId,
            'ruleId',
          ),
          projectId: this.toObjectId(
            projectId,
            'projectId',
          ),
        })
        .exec();

    if (!rule) {
      throw new NotFoundException(
        `Flow Rule ${ruleId} was not found ` +
          `in project ${projectId}.`,
      );
    }

    return rule;
  }

  private normalizeConditions(
    conditions: FlowRuleConditionDto[],
  ): FlowRuleConditionDto[] {
    return (conditions || []).map(
      (condition) => ({
        field: condition.field,
        operator: condition.operator,
        value:
          condition.value === undefined
            ? undefined
            : condition.value.trim(),
      }),
    );
  }

  private normalizeActions(
    actions: FlowRuleActionDto[],
  ): FlowRuleActionDto[] {
    return (actions || []).map(
      (action) => ({
        type: action.type,
        value:
          action.value === undefined
            ? undefined
            : action.value.trim(),
        message:
          action.message === undefined
            ? undefined
            : action.message.trim(),
      }),
    );
  }

  private validateDefinition(
    conditions: FlowRuleConditionDto[],
    actions: FlowRuleActionDto[],
  ): void {
    if (
      !Array.isArray(actions) ||
      actions.length === 0
    ) {
      throw new BadRequestException(
        'A Flow Rule requires at least one action.',
      );
    }

    for (const condition of conditions || []) {
      this.validateCondition(condition);
    }

    for (const action of actions) {
      this.validateAction(action);
    }
  }

  private validateCondition(
    condition: FlowRuleConditionDto,
  ): void {
    const requiresValue =
      condition.operator ===
        FlowRuleConditionOperator.EQUALS ||
      condition.operator ===
        FlowRuleConditionOperator.NOT_EQUALS;

    if (
      requiresValue &&
      !condition.value?.trim()
    ) {
      throw new BadRequestException(
        `Condition ${condition.field} ` +
          `${condition.operator} requires a value.`,
      );
    }

    if (!requiresValue) {
      return;
    }

    const value =
      condition.value!.trim();

    if (
      condition.field ===
        FlowRuleConditionField.PRIORITY &&
      !Object.values(TaskPriority).includes(
        value as TaskPriority,
      )
    ) {
      throw new BadRequestException(
        `Invalid priority condition: ${value}.`,
      );
    }

    if (
      condition.field ===
        FlowRuleConditionField.STATUS &&
      !Object.values(TaskStatus).includes(
        value as TaskStatus,
      )
    ) {
      throw new BadRequestException(
        `Invalid status condition: ${value}.`,
      );
    }

    if (
      condition.field ===
        FlowRuleConditionField.ASSIGNEE_ID &&
      !Types.ObjectId.isValid(value)
    ) {
      throw new BadRequestException(
        'Assignee conditions require a valid user ID.',
      );
    }
  }

  private validateAction(
    action: FlowRuleActionDto,
  ): void {
    if (
      action.type ===
        FlowRuleActionType
          .SEND_PROJECT_NOTIFICATION
    ) {
      if (!action.message?.trim()) {
        throw new BadRequestException(
          'A notification action requires a message.',
        );
      }

      return;
    }

    if (!action.value?.trim()) {
      throw new BadRequestException(
        `Action ${action.type} requires a value.`,
      );
    }

    const value = action.value.trim();

    if (
      action.type ===
        FlowRuleActionType.ASSIGN_TASK &&
      !Types.ObjectId.isValid(value)
    ) {
      throw new BadRequestException(
        'Assign actions require a valid user ID.',
      );
    }

    if (
      action.type ===
        FlowRuleActionType.SET_PRIORITY &&
      !Object.values(TaskPriority).includes(
        value as TaskPriority,
      )
    ) {
      throw new BadRequestException(
        `Invalid priority action: ${value}.`,
      );
    }

    if (
      action.type ===
        FlowRuleActionType.SET_STATUS
    ) {
      if (
        !Object.values(TaskStatus).includes(
          value as TaskStatus,
        )
      ) {
        throw new BadRequestException(
          `Invalid status action: ${value}.`,
        );
      }

      if (value === TaskStatus.DONE) {
        throw new BadRequestException(
          'Flow Rules cannot mark a Move done yet. ' +
            'Completion requires the complete endpoint.',
        );
      }
    }
  }

  private optionalObjectId(
    value?: string,
  ): Types.ObjectId | null {
    if (
      !value ||
      !Types.ObjectId.isValid(value)
    ) {
      return null;
    }

    return new Types.ObjectId(value);
  }

  private toObjectId(
    value: string,
    label: string,
  ): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(
        `${label} must be a valid ObjectId.`,
      );
    }

    return new Types.ObjectId(value);
  }
}
