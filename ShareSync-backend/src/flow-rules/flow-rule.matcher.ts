import {
  Injectable,
} from '@nestjs/common';

import {
  TaskEvent,
} from '../tasks/events/task-events';

import {
  FlowRuleConditionField,
  FlowRuleConditionOperator,
} from './schemas/flow-rule.schema';

@Injectable()
export class FlowRuleMatcher {
  matches(
    rule: any,
    event: TaskEvent,
  ): boolean {
    const conditions = Array.isArray(rule?.conditions)
      ? rule.conditions
      : [];

    return conditions.every((condition: any) =>
      this.matchesCondition(
        condition,
        event,
      ),
    );
  }

  private matchesCondition(
    condition: any,
    event: TaskEvent,
  ): boolean {
    const actualValue = this.resolveValue(
      condition?.field,
      event,
    );

    const operator =
      condition?.operator as
        FlowRuleConditionOperator;

    if (
      operator ===
      FlowRuleConditionOperator.IS_EMPTY
    ) {
      return this.isEmpty(actualValue);
    }

    if (
      operator ===
      FlowRuleConditionOperator.IS_NOT_EMPTY
    ) {
      return !this.isEmpty(actualValue);
    }

    const expectedValue =
      this.normalizeValue(condition?.value);

    const normalizedActual =
      this.normalizeValue(actualValue);

    if (
      operator ===
      FlowRuleConditionOperator.EQUALS
    ) {
      return normalizedActual === expectedValue;
    }

    if (
      operator ===
      FlowRuleConditionOperator.NOT_EQUALS
    ) {
      return normalizedActual !== expectedValue;
    }

    return false;
  }

  private resolveValue(
    field: FlowRuleConditionField,
    event: TaskEvent,
  ): any {
    const snapshot = event?.snapshot || ({} as any);

    switch (field) {
      case FlowRuleConditionField.PRIORITY:
        return snapshot.priority;

      case FlowRuleConditionField.STATUS:
        return snapshot.status;

      case FlowRuleConditionField.ASSIGNEE_ID:
        return snapshot.assigneeId;

      default:
        return undefined;
    }
  }

  private isEmpty(value: any): boolean {
    return (
      value === null ||
      value === undefined ||
      String(value).trim() === ''
    );
  }

  private normalizeValue(value: any): string {
    if (
      value === null ||
      value === undefined
    ) {
      return '';
    }

    return String(value)
      .trim()
      .toLowerCase();
  }
}
