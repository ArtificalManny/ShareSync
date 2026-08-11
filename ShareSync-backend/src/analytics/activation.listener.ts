// activation-funnel-listener-v1
import {
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  OnEvent,
} from '@nestjs/event-emitter';

import {
  AnalyticsService,
} from './analytics.service';

@Injectable()
export class ActivationListener {
  private readonly logger =
    new Logger(ActivationListener.name);

  constructor(
    private readonly analytics:
      AnalyticsService,
  ) {}

  private getId(
    value: unknown,
  ): string {
    if (!value) return '';

    if (typeof value === 'string') {
      return value;
    }

    const candidate =
      value as any;

    return String(
      candidate?._id ||
      candidate?.id ||
      candidate ||
      '',
    );
  }

  private async record(
    userId: unknown,
    field:
      | 'projectCreatedAt'
      | 'firstMoveCreatedAt'
      | 'teammateInvitedAt'
      | 'firstMoveCompletedAt',
  ): Promise<void> {
    try {
      const normalized =
        this.getId(userId);

      if (!normalized) {
        return;
      }

      await this.analytics
        .recordActivationMilestone(
          normalized,
          field,
        );
    } catch (error: any) {
      // Activation instrumentation must never
      // break a successful product action.
      this.logger.warn(
        `Activation milestone ${field} could not be recorded: ${
          error?.message || error
        }`,
      );
    }
  }

  @OnEvent('project.created')
  async onProjectCreated(
    payload: any,
  ): Promise<void> {
    await this.record(
      payload?.userId ||
        payload?.actorId,
      'projectCreatedAt',
    );
  }

  @OnEvent('task.created')
  async onMoveCreated(
    payload: any,
  ): Promise<void> {
    await this.record(
      payload?.actorId ||
        payload?.userId ||
        payload?.createdBy,
      'firstMoveCreatedAt',
    );
  }

  @OnEvent('project.invite.created')
  async onTeammateInvited(
    payload: any,
  ): Promise<void> {
    await this.record(
      payload?.invitedBy ||
        payload?.actorId ||
        payload?.userId,
      'teammateInvitedAt',
    );
  }

  @OnEvent('task.completed')
  async onMoveCompleted(
    payload: any,
  ): Promise<void> {
    await this.record(
      payload?.actorId ||
        payload?.userId ||
        payload?.completedBy,
      'firstMoveCompletedAt',
    );
  }
}
