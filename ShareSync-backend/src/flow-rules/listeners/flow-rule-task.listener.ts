import {
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  OnEvent,
} from '@nestjs/event-emitter';
import {
  createHash,
} from 'crypto';

import {
  FlowRuleEventMeta,
  TASK_EVENT_BUS,
  TaskEvent,
  TaskEventType,
} from '../../tasks/events/task-events';
import {
  FlowRuleActionExecutor,
} from '../flow-rule-action.executor';
import {
  FlowRuleMatcher,
} from '../flow-rule.matcher';
import {
  FlowRulesService,
} from '../flow-rules.service';
import {
  FlowRuleTriggerType,
} from '../schemas/flow-rule.schema';

@Injectable()
export class FlowRuleTaskListener {
  private readonly logger = new Logger(
    FlowRuleTaskListener.name,
  );

  private readonly maximumDepth = 5;

  constructor(
    private readonly flowRulesService:
      FlowRulesService,
    private readonly matcher:
      FlowRuleMatcher,
    private readonly executor:
      FlowRuleActionExecutor,
  ) {}

  @OnEvent(TASK_EVENT_BUS.TASK_MUTATION)
  async handleTaskMutation(
    event: TaskEvent,
  ): Promise<void> {
    try {
      this.logger.log(
        '[FlowRulesTrace] listener-received ' +
          JSON.stringify({
            type: event?.type,
            projectId: event?.projectId,
            taskId: event?.taskId,
            actorId: event?.actorId,
            previousPriority:
              event?.changes?.previousPriority,
            newPriority:
              event?.changes?.newPriority,
            previousStatus:
              event?.changes?.previousStatus,
            newStatus:
              event?.changes?.newStatus,
            hasFlowRuleMeta: Boolean(
              event?.meta?.flowRules,
            ),
          }),
      );

      const triggerTypes =
        this.resolveTriggerTypes(event);

      this.logger.log(
        '[FlowRulesTrace] triggers-resolved ' +
          JSON.stringify({
            type: event?.type,
            projectId: event?.projectId,
            taskId: event?.taskId,
            triggerTypes,
          }),
      );

      if (triggerTypes.length === 0) {
        return;
      }

      const parentContext =
        this.resolveParentContext(event);

      if (
        parentContext.depth >=
        this.maximumDepth
      ) {
        this.logger.warn(
          `Flow Rule chain stopped at depth ` +
            `${parentContext.depth} for task ` +
            `${event.taskId}.`,
        );

        return;
      }

      const rules =
        await this.flowRulesService
          .findEnabledByTriggers(
            event.projectId,
            triggerTypes,
          );

      this.logger.log(
        '[FlowRulesTrace] rules-resolved ' +
          JSON.stringify({
            projectId: event?.projectId,
            taskId: event?.taskId,
            triggerTypes,
            enabledRuleCount: rules.length,
            ruleIds: rules.map(
              (rule: any) =>
                String(
                  rule?._id || rule?.id || '',
                ),
            ),
          }),
      );

      for (const rule of rules) {
        await this.processRule(
          rule,
          event,
          parentContext,
        );
      }
    } catch (error: any) {
      this.logger.error(
        `Flow Rule event handling failed: ` +
          `${error?.message || error}`,
        error?.stack,
      );
    }
  }

  private async processRule(
    rule: any,
    event: TaskEvent,
    parentContext: FlowRuleEventMeta,
  ): Promise<void> {
    const ruleId = String(
      rule?._id || rule?.id || '',
    );

    if (!ruleId) {
      return;
    }

    if (
      parentContext.executedRuleIds.includes(
        ruleId,
      )
    ) {
      return;
    }

    if (!this.matcher.matches(rule, event)) {
      return;
    }

    const childContext: FlowRuleEventMeta = {
      correlationId:
        parentContext.correlationId,
      depth: parentContext.depth + 1,
      executedRuleIds: Array.from(
        new Set([
          ...parentContext.executedRuleIds,
          ruleId,
        ]),
      ),
    };

    const executionUserId = this.normalizeId(
      rule?.updatedBy ||
        rule?.createdBy ||
        event?.actorId,
    );

    const execution =
      await this.flowRulesService
        .claimExecution({
          projectId: event.projectId,
          ruleId,
          taskId: event.taskId,
          triggerType: rule.triggerType,
          eventType: event.type,
          correlationId:
            childContext.correlationId,
          depth: childContext.depth,
          actorId: event.actorId,
          executionUserId,
          matchedConditionCount:
            Array.isArray(rule?.conditions)
              ? rule.conditions.length
              : 0,
        });

    if (!execution) {
      return;
    }

    const executionId = String(
      execution?._id || execution?.id || '',
    );

    try {
      const actionResults =
        await this.executor.execute(
          rule,
          event,
          childContext,
        );

      await this.flowRulesService
        .completeExecution(
          executionId,
          ruleId,
          actionResults.length,
        );

      this.logger.log(
        `Flow Rule ${ruleId} executed for ` +
          `task ${event.taskId}: ` +
          `${actionResults.join(', ')}`,
      );
    } catch (error: any) {
      await this.flowRulesService
        .failExecution(
          executionId,
          ruleId,
          error?.message || String(error),
        );

      this.logger.error(
        `Flow Rule ${ruleId} failed for ` +
          `task ${event.taskId}: ` +
          `${error?.message || error}`,
        error?.stack,
      );
    }
  }

  private resolveTriggerTypes(
    event: TaskEvent,
  ): FlowRuleTriggerType[] {
    if (
      event?.type ===
      TaskEventType.TASK_CREATED
    ) {
      return [
        FlowRuleTriggerType.TASK_CREATED,
      ];
    }

    const changes = event?.changes || {};
    const triggers =
      new Set<FlowRuleTriggerType>();

    if (
      event?.type ===
      TaskEventType.TASK_MOVED
    ) {
      if (
        changes.previousStatus !==
        changes.newStatus
      ) {
        triggers.add(
          FlowRuleTriggerType
            .TASK_STATUS_CHANGED,
        );
      }
    }

    if (
      event?.type ===
      TaskEventType.TASK_UPDATED
    ) {
      const statusChanged =
        changes.previousStatus !== undefined &&
        changes.newStatus !== undefined &&
        changes.previousStatus !==
          changes.newStatus;

      const priorityChanged =
        changes.previousPriority !==
          undefined &&
        changes.newPriority !== undefined &&
        changes.previousPriority !==
          changes.newPriority;

      if (statusChanged) {
        triggers.add(
          FlowRuleTriggerType
            .TASK_STATUS_CHANGED,
        );
      }

      if (priorityChanged) {
        triggers.add(
          FlowRuleTriggerType
            .TASK_PRIORITY_CHANGED,
        );
      }
    }

    return Array.from(triggers);
  }

  private resolveParentContext(
    event: TaskEvent,
  ): FlowRuleEventMeta {
    const existing =
      event?.meta?.flowRules;

    if (
      existing &&
      typeof existing.correlationId ===
        'string'
    ) {
      return {
        correlationId:
          existing.correlationId,
        depth:
          Number.isFinite(existing.depth)
            ? Math.max(
                0,
                Number(existing.depth),
              )
            : 0,
        executedRuleIds: Array.from(
          new Set(
            Array.isArray(
              existing.executedRuleIds,
            )
              ? existing.executedRuleIds
                  .map((value) =>
                    String(value || '').trim(),
                  )
                  .filter(Boolean)
              : [],
          ),
        ),
      };
    }

    return {
      correlationId:
        this.buildCorrelationId(event),
      depth: 0,
      executedRuleIds: [],
    };
  }

  private buildCorrelationId(
    event: TaskEvent,
  ): string {
    return createHash('sha256')
      .update(
        [
          event?.type,
          event?.projectId,
          event?.taskId,
          event?.actorId,
          event?.createdAt,
        ].join('|'),
      )
      .digest('hex')
      .slice(0, 40);
  }

  private normalizeId(value: any): string {
    if (!value) return '';

    if (
      typeof value === 'string' ||
      typeof value === 'number'
    ) {
      return String(value).trim();
    }

    if (
      typeof value?.toHexString ===
      'function'
    ) {
      try {
        return String(
          value.toHexString(),
        ).trim();
      } catch {
        return '';
      }
    }

    const candidate =
      value?.userId ??
      value?.user ??
      value?._id ??
      value?.id;

    if (
      !candidate ||
      candidate === value
    ) {
      return '';
    }

    return this.normalizeId(candidate);
  }
}
