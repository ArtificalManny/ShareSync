import {
  ConflictException,
} from '@nestjs/common';

import {
  DowngradeState,
  SubscriptionPlan,
} from './schemas/subscription.schema';

import {
  SubscriptionsService,
} from './subscriptions.service';

describe(
  'SubscriptionsService downgrade lifecycle',
  () => {
    const userId =
      '507f1f77bcf86cd799439011';

    let service: any;
    let stripeUpdate:
      jest.Mock;
    let modelUpdate:
      jest.Mock;
    let emit:
      jest.Mock;

    beforeEach(() => {
      stripeUpdate =
        jest.fn();

      modelUpdate =
        jest.fn(
          async () => ({
            modifiedCount:
              1,
          }),
        );

      emit =
        jest.fn();

      service =
        Object.create(
          SubscriptionsService
            .prototype,
        );

      service.stripe = {
        subscriptions: {
          update:
            stripeUpdate,
        },
      };

      service.subscriptionModel =
        {
          updateOne:
            modelUpdate,
        };

      service.eventEmitter = {
        emit,
      };

      service.logger = {
        log:
          jest.fn(),
        warn:
          jest.fn(),
        error:
          jest.fn(),
      };

      service.isStripeAvailable =
        jest.fn(
          () => true,
        );
    });

    it(
      'schedules Stripe cancellation at period end with a seven-day grace window',
      async () => {
        const periodEndSeconds =
          2_000_000_000;

        const effectiveAt =
          new Date(
            periodEndSeconds *
              1000,
          );

        const graceEndsAt =
          new Date(
            effectiveAt.getTime() +
              7 *
                24 *
                60 *
                60 *
                1000,
          );

        const subscription =
          {
            billingProvider:
              'stripe',

            stripeSubscriptionId:
              'sub_test_123',

            currentPeriodEnd:
              effectiveAt,

            downgradeState:
              DowngradeState
                .NONE,
          };

        service
          .getOrCreateSubscription =
          jest.fn(
            async () =>
              subscription,
          );

        stripeUpdate
          .mockResolvedValue(
            {
              cancel_at:
                null,

              current_period_end:
                periodEndSeconds,
            },
          );

        const result =
          await service
            .cancelSubscription(
              userId,
            );

        expect(
          stripeUpdate,
        ).toHaveBeenCalledWith(
          'sub_test_123',
          {
            cancel_at_period_end:
              true,
          },
        );

        const update =
          modelUpdate
            .mock.calls[0][1];

        expect(
          update.$set
            .downgradeState,
        ).toBe(
          'scheduled',
        );

        expect(
          update.$set
            .downgradeTargetPlan,
        ).toBe(
          SubscriptionPlan.FREE,
        );

        expect(
          update.$set
            .downgradeEffectiveAt,
        ).toEqual(
          effectiveAt,
        );

        expect(
          update.$set
            .downgradeGraceEndsAt,
        ).toEqual(
          graceEndsAt,
        );

        expect(
          result.cancelAt,
        ).toEqual(
          effectiveAt,
        );

        expect(
          emit,
        ).toHaveBeenCalledWith(
          'subscription.downgrade_scheduled',
          expect.objectContaining(
            {
              userId,

              billingProvider:
                'stripe',

              cycleKey:
                effectiveAt
                  .toISOString(),
            },
          ),
        );
      },
    );

    it(
      'resumes a scheduled Stripe subscription and emits restoration for the same downgrade cycle',
      async () => {
        const effectiveAt =
          new Date(
            '2030-01-02T03:04:05.000Z',
          );

        const subscription =
          {
            billingProvider:
              'stripe',

            stripeSubscriptionId:
              'sub_test_123',

            currentPeriodEnd:
              effectiveAt,

            cancelAt:
              effectiveAt,

            downgradeEffectiveAt:
              effectiveAt,

            downgradeState:
              DowngradeState
                .SCHEDULED,
          };

        service
          .getOrCreateSubscription =
          jest.fn(
            async () =>
              subscription,
          );

        stripeUpdate
          .mockResolvedValue(
            {},
          );

        await service
          .resumeSubscription(
            userId,
          );

        expect(
          stripeUpdate,
        ).toHaveBeenCalledWith(
          'sub_test_123',
          {
            cancel_at_period_end:
              false,
          },
        );

        const update =
          modelUpdate
            .mock.calls[0][1];

        expect(
          update.$set
            .downgradeState,
        ).toBe(
          'none',
        );

        expect(
          update.$unset,
        ).toEqual(
          expect.objectContaining(
            {
              cancelAt:
                1,

              downgradeTargetPlan:
                1,

              downgradeEffectiveAt:
                1,

              downgradeGraceEndsAt:
                1,
            },
          ),
        );

        expect(
          emit,
        ).toHaveBeenCalledWith(
          'subscription.restored',
          expect.objectContaining(
            {
              userId,

              billingProvider:
                'stripe',

              cycleKey:
                effectiveAt
                  .toISOString(),
            },
          ),
        );
      },
    );

    it(
      'does not emit a restoration event when there was no pending downgrade',
      async () => {
        const subscription =
          {
            billingProvider:
              'stripe',

            stripeSubscriptionId:
              'sub_test_123',

            currentPeriodEnd:
              new Date(
                '2030-01-02T03:04:05.000Z',
              ),

            downgradeState:
              DowngradeState
                .NONE,
          };

        service
          .getOrCreateSubscription =
          jest.fn(
            async () =>
              subscription,
          );

        stripeUpdate
          .mockResolvedValue(
            {},
          );

        await service
          .resumeSubscription(
            userId,
          );

        expect(
          emit,
        ).not
          .toHaveBeenCalledWith(
            'subscription.restored',
            expect.anything(),
          );
      },
    );

    it(
      'keeps future grace in GRACE state',
      () => {
        const result =
          service
            .getEffectiveDowngradeState(
              {
                downgradeState:
                  DowngradeState
                    .GRACE,

                downgradeGraceEndsAt:
                  new Date(
                    Date.now() +
                      60_000,
                  ),
              },
            );

        expect(
          result.state,
        ).toBe(
          DowngradeState
            .GRACE,
        );

        expect(
          result.graceActive,
        ).toBe(
          true,
        );
      },
    );

    it(
      'fails closed to RESTRICTED when grace has expired',
      () => {
        const result =
          service
            .getEffectiveDowngradeState(
              {
                downgradeState:
                  DowngradeState
                    .GRACE,

                downgradeGraceEndsAt:
                  new Date(
                    Date.now() -
                      60_000,
                  ),
              },
            );

        expect(
          result.state,
        ).toBe(
          DowngradeState
            .RESTRICTED,
        );

        expect(
          result.graceActive,
        ).toBe(
          false,
        );
      },
    );

    it(
      'fails closed to RESTRICTED when persisted grace has no valid end date',
      () => {
        const result =
          service
            .getEffectiveDowngradeState(
              {
                downgradeState:
                  DowngradeState
                    .GRACE,

                downgradeGraceEndsAt:
                  undefined,
              },
            );

        expect(
          result.state,
        ).toBe(
          DowngradeState
            .RESTRICTED,
        );
      },
    );

    it(
      'refuses Stripe cancellation for an Apple-billed subscription',
      async () => {
        service
          .getOrCreateSubscription =
          jest.fn(
            async () => ({
              billingProvider:
                'apple',

              stripeSubscriptionId:
                'legacy_sub',
            }),
          );

        await expect(
          service
            .cancelSubscription(
              userId,
            ),
        ).rejects
          .toBeInstanceOf(
            ConflictException,
          );

        expect(
          stripeUpdate,
        ).not
          .toHaveBeenCalled();
      },
    );

    it(
      'refuses Stripe resume for an Apple-billed subscription',
      async () => {
        service
          .getOrCreateSubscription =
          jest.fn(
            async () => ({
              billingProvider:
                'apple',

              stripeSubscriptionId:
                'legacy_sub',
            }),
          );

        await expect(
          service
            .resumeSubscription(
              userId,
            ),
        ).rejects
          .toBeInstanceOf(
            ConflictException,
          );

        expect(
          stripeUpdate,
        ).not
          .toHaveBeenCalled();
      },
    );
  },
);
