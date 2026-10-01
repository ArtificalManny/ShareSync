import {
  Injectable,
  Logger,
} from '@nestjs/common';

import {
  InjectModel,
} from '@nestjs/mongoose';

import {
  OnEvent,
} from '@nestjs/event-emitter';

import {
  Cron,
  CronExpression,
} from '@nestjs/schedule';

import {
  Model,
  Types,
} from 'mongoose';

import {
  NotificationsService,
} from '../../notifications/notifications.service';

import {
  NotificationPriority,
  NotificationType,
} from '../../notifications/schemas/notification.schema';

import {
  DowngradeState,
  Subscription,
  SubscriptionDocument,
} from '../schemas/subscription.schema';

import {
  SubscriptionsService,
} from '../subscriptions.service';

type LifecycleMarkerField =
  | 'downgradeScheduledNotificationKey'
  | 'downgradeGraceStartedNotificationKey'
  | 'downgradeGraceEndingNotificationKey'
  | 'downgradeRestrictedNotificationKey'
  | 'downgradeRestoredNotificationKey';

type LifecycleKind =
  | 'scheduled'
  | 'grace_started'
  | 'grace_ending'
  | 'restricted'
  | 'restored';

type LifecycleEventPayload = {
  userId?: string;
  cycleKey?: string;
  effectiveAt?: string | Date | null;
};

@Injectable()
export class SubscriptionLifecycleNotificationListener {
  private readonly logger =
    new Logger(
      SubscriptionLifecycleNotificationListener.name,
    );

  private readonly graceEndingWindowMs =
    24 * 60 * 60 * 1000;

  constructor(
    @InjectModel(Subscription.name)
    private readonly subscriptionModel:
      Model<SubscriptionDocument>,

    private readonly subscriptionsService:
      SubscriptionsService,

    private readonly notificationsService:
      NotificationsService,
  ) {}

  private normalizeUserId(
    value: unknown,
  ): string | null {
    const normalized =
      String(value || '').trim();

    return Types.ObjectId.isValid(
      normalized,
    )
      ? normalized
      : null;
  }

  private dateKey(
    value: unknown,
  ): string | null {
    if (!value) {
      return null;
    }

    const date =
      new Date(value as any);

    return Number.isFinite(
      date.getTime(),
    )
      ? date.toISOString()
      : null;
  }

  private cycleKeyFromSubscription(
    subscription: any,
  ): string | null {
    return (
      this.dateKey(
        subscription
          ?.downgradeEffectiveAt,
      ) ||
      this.dateKey(
        subscription
          ?.cancelAt,
      ) ||
      this.dateKey(
        subscription
          ?.currentPeriodEnd,
      ) ||
      null
    );
  }

  private priorCycleKey(
    subscription: any,
  ): string | null {
    const values = [
      subscription
        ?.downgradeRestrictedNotificationKey,
      subscription
        ?.downgradeGraceEndingNotificationKey,
      subscription
        ?.downgradeGraceStartedNotificationKey,
      subscription
        ?.downgradeScheduledNotificationKey,
    ];

    for (const value of values) {
      const normalized =
        String(value || '').trim();

      if (normalized) {
        return normalized;
      }
    }

    return null;
  }

  private async getSubscription(
    userId: string,
  ): Promise<any | null> {
    return this.subscriptionModel
      .findOne({
        userId:
          new Types.ObjectId(
            userId,
          ),
      })
      .lean()
      .exec();
  }

  private async claimLifecycleMarker(
    subscriptionId: unknown,
    field: LifecycleMarkerField,
    cycleKey: string,
  ): Promise<boolean> {
    const result =
      await this.subscriptionModel
        .updateOne(
          {
            _id:
              subscriptionId,
            [field]: {
              $ne:
                cycleKey,
            },
          } as any,
          {
            $set: {
              [field]:
                cycleKey,
            },
          } as any,
        );

    return (
      result.modifiedCount ===
      1
    );
  }

  private async releaseLifecycleMarker(
    subscriptionId: unknown,
    field: LifecycleMarkerField,
    cycleKey: string,
  ): Promise<void> {
    await this.subscriptionModel
      .updateOne(
        {
          _id:
            subscriptionId,
          [field]:
            cycleKey,
        } as any,
        {
          $unset: {
            [field]:
              1,
          },
        } as any,
      );
  }

  private billingUrl(): string {
    return (
      '/settings/billing/downgrade'
    );
  }

  private formatDate(
    value: unknown,
  ): string {
    const date =
      new Date(value as any);

    if (
      !Number.isFinite(
        date.getTime(),
      )
    ) {
      return 'the scheduled date';
    }

    return new Intl.DateTimeFormat(
      'en-CA',
      {
        dateStyle:
          'medium',
      },
    ).format(date);
  }

  private async sendLifecycleNotification(
    args: {
      subscription: any;
      userId: string;
      cycleKey: string;
      marker:
        LifecycleMarkerField;
      kind: LifecycleKind;
      title: string;
      body: string;
      priority?:
        NotificationPriority;
    },
  ): Promise<void> {
    const claimed =
      await this
        .claimLifecycleMarker(
          args.subscription._id,
          args.marker,
          args.cycleKey,
        );

    if (!claimed) {
      return;
    }

    try {
      await this.notificationsService
        .notify(
          {
            userId:
              args.userId,

            type:
              NotificationType
                .SUBSCRIPTION_UPDATE,

            title:
              args.title,

            body:
              args.body,

            icon:
              'credit-card',

            priority:
              args.priority ||
              NotificationPriority
                .NORMAL,

            data: {
              // Reuse the existing notification fan-out policy rather
              // than bypassing channel verification / email opt-in.
              emailFanoutEligible:
                true,

              extra: {
                lifecycleKind:
                  args.kind,
                downgradeCycleKey:
                  args.cycleKey,
              },
            },

            actions: [
              {
                label:
                  'Review billing',
                url:
                  this.billingUrl(),
              },
            ],

            groupKey:
              [
                'subscription',
                args.kind,
                args.userId,
                args.cycleKey,
              ]
                .join('-')
                .replace(
                  /[^A-Za-z0-9_-]/g,
                  '_',
                ),
          } as any,
        );
    } catch (error: any) {
      await this
        .releaseLifecycleMarker(
          args.subscription._id,
          args.marker,
          args.cycleKey,
        );

      this.logger.error(
        `Lifecycle notification ${args.kind} failed for ${args.userId}: ${
          error?.message ||
          error
        }`,
      );
    }
  }

  private async notifyScheduled(
    subscription: any,
    userId: string,
    cycleKey: string,
  ): Promise<void> {
    await this
      .sendLifecycleNotification(
        {
          subscription,
          userId,
          cycleKey,

          marker:
            'downgradeScheduledNotificationKey',

          kind:
            'scheduled',

          title:
            'Team cancellation scheduled',

          body:
            `Your Team plan remains active until ${this.formatDate(
              subscription
                ?.downgradeEffectiveAt ||
              subscription
                ?.cancelAt,
            )}. Your work will be preserved when the account moves to Free.`,

          priority:
            NotificationPriority
              .HIGH,
        },
      );
  }

  private async notifyGraceStarted(
    subscription: any,
    userId: string,
    cycleKey: string,
  ): Promise<void> {
    await this
      .sendLifecycleNotification(
        {
          subscription,
          userId,
          cycleKey,

          marker:
            'downgradeGraceStartedNotificationKey',

          kind:
            'grace_started',

          title:
            'Your Free-plan grace period has started',

          body:
            `Your paid Team period has ended. Your work remains preserved, and you have until ${this.formatDate(
              subscription
                ?.downgradeGraceEndsAt,
            )} to review projects, members, storage, and AI usage for the Free plan.`,

          priority:
            NotificationPriority
              .HIGH,
        },
      );
  }

  private async notifyGraceEnding(
    subscription: any,
    userId: string,
    cycleKey: string,
  ): Promise<void> {
    await this
      .sendLifecycleNotification(
        {
          subscription,
          userId,
          cycleKey,

          marker:
            'downgradeGraceEndingNotificationKey',

          kind:
            'grace_ending',

          title:
            'Your Free-plan grace period ends soon',

          body:
            `Your downgrade grace period ends on ${this.formatDate(
              subscription
                ?.downgradeGraceEndsAt,
            )}. Review your retained projects and members before then. Existing work will not be deleted.`,

          priority:
            NotificationPriority
              .HIGH,
        },
      );
  }

  private async notifyRestrictionResult(
    subscription: any,
    userId: string,
    cycleKey: string,
  ): Promise<void> {
    let entitlements: any;

    try {
      entitlements =
        await this
          .subscriptionsService
          .getEntitlements(
            userId,
          );
    } catch (error: any) {
      this.logger.warn(
        `Could not resolve downgrade entitlements for ${userId}: ${
          error?.message ||
          error
        }`,
      );

      return;
    }

    const over = [
      entitlements
        ?.projects
        ?.overLimit
        ? 'projects'
        : null,

      entitlements
        ?.members
        ?.overLimit
        ? 'members'
        : null,

      entitlements
        ?.storage
        ?.overLimit
        ? 'storage'
        : null,

      entitlements
        ?.ai
        ?.overLimit
        ? 'AI usage'
        : null,
    ].filter(Boolean);

    const overText =
      over.length > 0
        ? (
            ` Your ${over.join(
              ', ',
            )} exceed Free allowances, so only the affected actions are restricted until the workspace is within limits or Team is restored.`
          )
        : (
            ' Your workspace is within the Free allowances, so no over-limit restrictions are required.'
          );

    await this
      .sendLifecycleNotification(
        {
          subscription,
          userId,
          cycleKey,

          marker:
            'downgradeRestrictedNotificationKey',

          kind:
            'restricted',

          title:
            'Your downgrade to Free is complete',

          body:
            `Your existing projects, files, messages, memberships, and history remain preserved.${overText}`,

          priority:
            over.length > 0
              ? NotificationPriority
                  .HIGH
              : NotificationPriority
                  .NORMAL,
        },
      );
  }

  private async notifyRestored(
    subscription: any,
    userId: string,
    cycleKey: string,
  ): Promise<void> {
    await this
      .sendLifecycleNotification(
        {
          subscription,
          userId,
          cycleKey,

          marker:
            'downgradeRestoredNotificationKey',

          kind:
            'restored',

          title:
            'Team access restored',

          body:
            'Your Team subscription is active again. Preserved projects, members, storage capacity, and Team features are available under your Team limits.',

          priority:
            NotificationPriority
              .NORMAL,
        },
      );
  }

  @OnEvent(
    'subscription.canceled',
    {
      async: true,
    },
  )
  async handlePaidAccessEnded(
    payload:
      LifecycleEventPayload,
  ): Promise<void> {
    const userId =
      this.normalizeUserId(
        payload?.userId,
      );

    if (!userId) {
      return;
    }

    const subscription =
      await this.getSubscription(
        userId,
      );

    if (!subscription) {
      return;
    }

    const cycleKey =
      this.cycleKeyFromSubscription(
        subscription,
      );

    if (!cycleKey) {
      return;
    }

    await this
      .notifyGraceStarted(
        subscription,
        userId,
        cycleKey,
      );
  }

  @OnEvent(
    'subscription.activated',
    {
      async: true,
    },
  )
  async handleSubscriptionActivated(
    payload:
      LifecycleEventPayload,
  ): Promise<void> {
    const userId =
      this.normalizeUserId(
        payload?.userId,
      );

    if (!userId) {
      return;
    }

    const subscription =
      await this.getSubscription(
        userId,
      );

    if (!subscription) {
      return;
    }

    // A first-ever Team purchase has no prior downgrade marker.
    // A re-upgrade after a downgrade does.
    const cycleKey =
      this.priorCycleKey(
        subscription,
      );

    if (!cycleKey) {
      return;
    }

    await this
      .notifyRestored(
        subscription,
        userId,
        cycleKey,
      );
  }

  @OnEvent(
    'subscription.downgrade_scheduled',
    {
      async: true,
    },
  )
  async handleDowngradeScheduled(
    payload:
      LifecycleEventPayload,
  ): Promise<void> {
    const userId =
      this.normalizeUserId(
        payload?.userId,
      );

    if (!userId) {
      return;
    }

    const subscription =
      await this.getSubscription(
        userId,
      );

    if (!subscription) {
      return;
    }

    const cycleKey =
      payload?.cycleKey ||
      this.dateKey(
        payload
          ?.effectiveAt,
      ) ||
      this
        .cycleKeyFromSubscription(
          subscription,
        );

    if (!cycleKey) {
      return;
    }

    await this
      .notifyScheduled(
        subscription,
        userId,
        cycleKey,
      );
  }

  @OnEvent(
    'subscription.restored',
    {
      async: true,
    },
  )
  async handleSubscriptionRestored(
    payload:
      LifecycleEventPayload,
  ): Promise<void> {
    const userId =
      this.normalizeUserId(
        payload?.userId,
      );

    if (!userId) {
      return;
    }

    const subscription =
      await this.getSubscription(
        userId,
      );

    if (!subscription) {
      return;
    }

    const cycleKey =
      String(
        payload?.cycleKey ||
        this.priorCycleKey(
          subscription,
        ) ||
        '',
      ).trim();

    if (!cycleKey) {
      return;
    }

    await this
      .notifyRestored(
        subscription,
        userId,
        cycleKey,
      );
  }

  @Cron(
    CronExpression.EVERY_HOUR,
  )
  async sweepDowngradeLifecycleNotifications():
    Promise<void> {
    const now =
      new Date();

    const rows =
      await this.subscriptionModel
        .find({
          downgradeState: {
            $in: [
              DowngradeState
                .SCHEDULED,
              DowngradeState
                .GRACE,
              DowngradeState
                .RESTRICTED,
            ],
          },
        })
        .lean()
        .exec();

    for (const subscription of rows as any[]) {
      const userId =
        this.normalizeUserId(
          subscription
            ?.userId,
        );

      if (!userId) {
        continue;
      }

      const cycleKey =
        this.cycleKeyFromSubscription(
          subscription,
        ) ||
        this.priorCycleKey(
          subscription,
        );

      if (!cycleKey) {
        continue;
      }

      if (
        subscription
          .downgradeState ===
        DowngradeState
          .SCHEDULED
      ) {
        await this
          .notifyScheduled(
            subscription,
            userId,
            cycleKey,
          );

        continue;
      }

      const graceEndsAt =
        subscription
          ?.downgradeGraceEndsAt
          ? new Date(
              subscription
                .downgradeGraceEndsAt,
            )
          : null;

      const graceEndsMs =
        graceEndsAt &&
        Number.isFinite(
          graceEndsAt.getTime(),
        )
          ? graceEndsAt.getTime()
          : null;

      if (
        subscription
          .downgradeState ===
          DowngradeState.GRACE &&
        graceEndsMs !== null &&
        graceEndsMs >
          now.getTime()
      ) {
        await this
          .notifyGraceStarted(
            subscription,
            userId,
            cycleKey,
          );

        if (
          graceEndsMs -
            now.getTime() <=
          this
            .graceEndingWindowMs
        ) {
          await this
            .notifyGraceEnding(
              subscription,
              userId,
              cycleKey,
            );
        }

        continue;
      }

      // The core entitlement service already treats expired GRACE as
      // RESTRICTED even if no scheduler has persisted that transition.
      // This worker observes that boundary; it does not redefine it.
      await this
        .notifyRestrictionResult(
          subscription,
          userId,
          cycleKey,
        );
    }
  }
}
