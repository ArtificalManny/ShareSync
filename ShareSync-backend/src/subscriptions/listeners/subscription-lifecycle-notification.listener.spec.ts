import {
  DowngradeState,
} from '../schemas/subscription.schema';

import {
  SubscriptionLifecycleNotificationListener,
} from './subscription-lifecycle-notification.listener';

describe(
  'SubscriptionLifecycleNotificationListener',
  () => {
    const userId =
      '507f1f77bcf86cd799439011';

    const subscriptionId =
      '507f1f77bcf86cd799439012';

    let row: any;
    let model: any;
    let subscriptionsService: any;
    let notificationsService: any;
    let listener:
      SubscriptionLifecycleNotificationListener;

    function queryResult(
      value: any,
    ) {
      return {
        lean: () => ({
          exec:
            async () =>
              value,
        }),
      };
    }

    function resetRow(
      overrides: Record<
        string,
        any
      > = {},
    ) {
      row = {
        _id:
          subscriptionId,

        userId,

        plan:
          'free',

        downgradeState:
          DowngradeState
            .SCHEDULED,

        downgradeEffectiveAt:
          new Date(
            Date.now() +
              5 *
                24 *
                60 *
                60 *
                1000,
          ),

        downgradeGraceEndsAt:
          new Date(
            Date.now() +
              12 *
                24 *
                60 *
                60 *
                1000,
          ),

        ...overrides,
      };
    }

    beforeEach(() => {
      resetRow();

      model = {
        findOne:
          jest.fn(
            () =>
              queryResult(
                row,
              ),
          ),

        find:
          jest.fn(
            () =>
              queryResult(
                [row],
              ),
          ),

        updateOne:
          jest.fn(
            async (
              filter: any,
              update: any,
            ) => {
              const markerEntry =
                Object.entries(
                  filter,
                ).find(
                  ([
                    _key,
                    value,
                  ]) =>
                    value &&
                    typeof value ===
                      'object' &&
                    '$ne' in
                      (value as any),
                );

              if (
                markerEntry
              ) {
                const [
                  field,
                  condition,
                ] =
                  markerEntry as [
                    string,
                    any,
                  ];

                const next =
                  condition.$ne;

                if (
                  row[field] ===
                  next
                ) {
                  return {
                    modifiedCount:
                      0,
                  };
                }
              }

              if (
                update?.$set
              ) {
                Object.assign(
                  row,
                  update.$set,
                );
              }

              if (
                update?.$unset
              ) {
                for (
                  const field
                  of Object.keys(
                    update.$unset,
                  )
                ) {
                  delete row[
                    field
                  ];
                }
              }

              return {
                modifiedCount:
                  1,
              };
            },
          ),
      };

      subscriptionsService = {
        getEntitlements:
          jest.fn(
            async () => ({
              projects: {
                overLimit:
                  false,
              },
              members: {
                overLimit:
                  false,
              },
              storage: {
                overLimit:
                  false,
              },
              ai: {
                overLimit:
                  false,
              },
            }),
          ),
      };

      notificationsService = {
        notify:
          jest.fn(
            async (
              payload,
            ) => payload,
          ),
      };

      listener =
        new SubscriptionLifecycleNotificationListener(
          model,
          subscriptionsService,
          notificationsService,
        );
    });

    it(
      'sends scheduled downgrade notification only once per cycle',
      async () => {
        const cycleKey =
          new Date(
            row
              .downgradeEffectiveAt,
          ).toISOString();

        await listener
          .handleDowngradeScheduled(
            {
              userId,
              cycleKey,
            },
          );

        await listener
          .handleDowngradeScheduled(
            {
              userId,
              cycleKey,
            },
          );

        expect(
          notificationsService
            .notify,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          notificationsService
            .notify,
        ).toHaveBeenCalledWith(
          expect.objectContaining(
            {
              userId,

              title:
                'Team cancellation scheduled',

              data:
                expect.objectContaining(
                  {
                    emailFanoutEligible:
                      true,
                  },
                ),
            },
          ),
        );

        expect(
          row
            .downgradeScheduledNotificationKey,
        ).toBe(
          cycleKey,
        );
      },
    );

    it(
      'starts grace notification once when paid access ends',
      async () => {
        resetRow({
          downgradeState:
            DowngradeState
              .GRACE,

          downgradeEffectiveAt:
            new Date(
              Date.now() -
                60_000,
            ),

          downgradeGraceEndsAt:
            new Date(
              Date.now() +
                7 *
                  24 *
                  60 *
                  60 *
                  1000,
            ),
        });

        await listener
          .handlePaidAccessEnded(
            {
              userId,
            },
          );

        await listener
          .handlePaidAccessEnded(
            {
              userId,
            },
          );

        expect(
          notificationsService
            .notify,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          notificationsService
            .notify,
        ).toHaveBeenCalledWith(
          expect.objectContaining(
            {
              title:
                'Your Free-plan grace period has started',
            },
          ),
        );
      },
    );

    it(
      'notifies when grace has less than 24 hours remaining',
      async () => {
        resetRow({
          downgradeState:
            DowngradeState
              .GRACE,

          downgradeEffectiveAt:
            new Date(
              Date.now() -
                6 *
                  24 *
                  60 *
                  60 *
                  1000,
            ),

          downgradeGraceEndsAt:
            new Date(
              Date.now() +
                12 *
                  60 *
                  60 *
                  1000,
            ),
        });

        await listener
          .sweepDowngradeLifecycleNotifications();

        const titles =
          notificationsService
            .notify.mock.calls.map(
              (
                call: any[],
              ) =>
                call[0]
                  .title,
            );

        expect(
          titles,
        ).toContain(
          'Your Free-plan grace period has started',
        );

        expect(
          titles,
        ).toContain(
          'Your Free-plan grace period ends soon',
        );

        expect(
          row
            .downgradeGraceEndingNotificationKey,
        ).toBeDefined();
      },
    );

    it(
      'notifies about restrictions after grace expires',
      async () => {
        resetRow({
          downgradeState:
            DowngradeState
              .GRACE,

          downgradeEffectiveAt:
            new Date(
              Date.now() -
                8 *
                  24 *
                  60 *
                  60 *
                  1000,
            ),

          downgradeGraceEndsAt:
            new Date(
              Date.now() -
                60_000,
            ),
        });

        subscriptionsService
          .getEntitlements
          .mockResolvedValue(
            {
              projects: {
                overLimit:
                  true,
              },
              members: {
                overLimit:
                  false,
              },
              storage: {
                overLimit:
                  true,
              },
              ai: {
                overLimit:
                  false,
              },
            },
          );

        await listener
          .sweepDowngradeLifecycleNotifications();

        expect(
          subscriptionsService
            .getEntitlements,
        ).toHaveBeenCalledWith(
          userId,
        );

        expect(
          notificationsService
            .notify,
        ).toHaveBeenCalledWith(
          expect.objectContaining(
            {
              title:
                'Your downgrade to Free is complete',

              body:
                expect.stringContaining(
                  'projects',
                ),
            },
          ),
        );

        expect(
          row
            .downgradeRestrictedNotificationKey,
        ).toBeDefined();
      },
    );

    it(
      'notifies once when Team access is restored after a downgrade',
      async () => {
        const priorCycle =
          new Date(
            Date.now() -
              24 *
                60 *
                60 *
                1000,
          ).toISOString();

        resetRow({
          downgradeState:
            DowngradeState
              .NONE,

          downgradeScheduledNotificationKey:
            priorCycle,

          downgradeEffectiveAt:
            undefined,

          downgradeGraceEndsAt:
            undefined,
        });

        await listener
          .handleSubscriptionActivated(
            {
              userId,
            },
          );

        await listener
          .handleSubscriptionActivated(
            {
              userId,
            },
          );

        expect(
          notificationsService
            .notify,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          notificationsService
            .notify,
        ).toHaveBeenCalledWith(
          expect.objectContaining(
            {
              title:
                'Team access restored',
            },
          ),
        );

        expect(
          row
            .downgradeRestoredNotificationKey,
        ).toBe(
          priorCycle,
        );
      },
    );

    it(
      'does not classify a first-ever Team activation as a restoration',
      async () => {
        resetRow({
          downgradeState:
            DowngradeState
              .NONE,

          downgradeEffectiveAt:
            undefined,

          downgradeGraceEndsAt:
            undefined,
        });

        await listener
          .handleSubscriptionActivated(
            {
              userId,
            },
          );

        expect(
          notificationsService
            .notify,
        ).not
          .toHaveBeenCalled();
      },
    );

    it(
      'releases the lifecycle marker when notification delivery fails so retry is possible',
      async () => {
        const cycleKey =
          new Date(
            row
              .downgradeEffectiveAt,
          ).toISOString();

        notificationsService
          .notify
          .mockRejectedValueOnce(
            new Error(
              'temporary failure',
            ),
          )
          .mockResolvedValueOnce(
            {},
          );

        await listener
          .handleDowngradeScheduled(
            {
              userId,
              cycleKey,
            },
          );

        expect(
          row
            .downgradeScheduledNotificationKey,
        ).toBeUndefined();

        await listener
          .handleDowngradeScheduled(
            {
              userId,
              cycleKey,
            },
          );

        expect(
          notificationsService
            .notify,
        ).toHaveBeenCalledTimes(
          2,
        );

        expect(
          row
            .downgradeScheduledNotificationKey,
        ).toBe(
          cycleKey,
        );
      },
    );
  },
);
