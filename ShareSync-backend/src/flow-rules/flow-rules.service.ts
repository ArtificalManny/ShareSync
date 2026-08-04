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
  CreateFlowRuleDto,
  FlowRuleActionDto,
  FlowRuleConditionDto,
} from './dto/create-flow-rule.dto';
import {
  UpdateFlowRuleDto,
} from './dto/update-flow-rule.dto';
import {
  FlowRule,
  FlowRuleActionType,
  FlowRuleConditionOperator,
  FlowRuleDocument,
} from './schemas/flow-rule.schema';

@Injectable()
export class FlowRulesService {
  private readonly maximumRulesPerProject = 50;

  constructor(
    @InjectModel(FlowRule.name)
    private readonly flowRuleModel: Model<FlowRuleDocument>,
  ) {}

  async list(projectId: string) {
    const normalizedProjectId =
      this.toObjectId(projectId, 'projectId');

    return this.flowRuleModel
      .find({
        projectId: normalizedProjectId,
      })
      .sort({
        createdAt: -1,
      })
      .select('-__v')
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

  async create(
    projectId: string,
    userId: string,
    dto: CreateFlowRuleDto,
  ) {
    const normalizedProjectId =
      this.toObjectId(projectId, 'projectId');

    const normalizedUserId =
      this.toObjectId(userId, 'userId');

    const currentRuleCount =
      await this.flowRuleModel.countDocuments({
        projectId: normalizedProjectId,
      });

    if (
      currentRuleCount >=
      this.maximumRulesPerProject
    ) {
      throw new BadRequestException(
        `A project can have at most ` +
          `${this.maximumRulesPerProject} Flow Rules.`,
      );
    }

    this.validateDefinition(
      dto.conditions || [],
      dto.actions,
    );

    const rule = await this.flowRuleModel.create({
      projectId: normalizedProjectId,
      name: dto.name.trim(),
      description: dto.description?.trim() || '',
      triggerType: dto.triggerType,
      conditions: dto.conditions || [],
      actions: dto.actions,
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
      dto.conditions ??
      (rule.conditions as FlowRuleConditionDto[]);

    const nextActions =
      dto.actions ??
      (rule.actions as FlowRuleActionDto[]);

    this.validateDefinition(
      nextConditions,
      nextActions,
    );

    if (dto.name !== undefined) {
      rule.name = dto.name.trim();
    }

    if (dto.description !== undefined) {
      rule.description = dto.description.trim();
    }

    if (dto.triggerType !== undefined) {
      rule.triggerType = dto.triggerType;
    }

    if (dto.conditions !== undefined) {
      rule.conditions = dto.conditions;
    }

    if (dto.actions !== undefined) {
      rule.actions = dto.actions;
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

    await rule.deleteOne();
  }

  private async findDocument(
    projectId: string,
    ruleId: string,
  ): Promise<FlowRuleDocument> {
    const rule = await this.flowRuleModel
      .findOne({
        _id: this.toObjectId(ruleId, 'ruleId'),
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
    }

    for (const action of actions) {
      const requiresValue = [
        FlowRuleActionType.ASSIGN_TASK,
        FlowRuleActionType.SET_PRIORITY,
        FlowRuleActionType.SET_STATUS,
      ].includes(action.type);

      if (
        requiresValue &&
        !action.value?.trim()
      ) {
        throw new BadRequestException(
          `Action ${action.type} requires a value.`,
        );
      }

      if (
        action.type ===
          FlowRuleActionType
            .SEND_PROJECT_NOTIFICATION &&
        !action.message?.trim()
      ) {
        throw new BadRequestException(
          'A notification action requires a message.',
        );
      }
    }
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
