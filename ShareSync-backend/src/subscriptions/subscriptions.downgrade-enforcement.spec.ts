import {
  DowngradeState,
} from './schemas/subscription.schema';

import {
  SubscriptionsService,
} from './subscriptions.service';

describe(
  'SubscriptionsService downgrade enforcement',
  () => {
    const ownerId =
      '507f1f77bcf86cd799439011';

    const retainedMemberId =
      '507f1f77bcf86cd799439012';

    const excessMemberId =
      '507f1f77bcf86cd799439013';

    const projectId =
      '507f1f77bcf86cd799439021';

    const retainedProjectId =
      projectId;

    const otherRetainedProjectIds = [
      '507f1f77bcf86cd799439022',
      '507f1f77bcf86cd799439023',
      '507f1f77bcf86cd799439024',
      '507f1f77bcf86cd799439025',
      '507f1f77bcf86cd799439026',
      '507f1f77bcf86cd799439027',
      '507f1f77bcf86cd799439028',
      '507f1f77bcf86cd799439029',
      '507f1f77bcf86cd799439030',
    ];

    let service: any;
    let projectUpdate:
      jest.Mock;

    function queryResult(
      value: any,
    ) {
      return {
        select:
          () => ({
            lean:
              () => ({
                exec:
                  async () =>
                    value,
              }),
          }),
      };
    }

    beforeEach(() => {
      service =
        Object.create(
          SubscriptionsService
            .prototype,
        );

      projectUpdate =
        jest.fn();

      service.projectModel = {
        findById:
          jest.fn(
            () =>
              queryResult({
                _id:
                  projectId,

                ownerId,
              }),
          ),

        updateOne:
          projectUpdate,
      };

      service
        .getWorkspaceOwnerIdFromProject =
        jest.fn(
          () => ownerId,
        );

      service
        .getEffectiveDowngradeState =
        jest.fn(
          () => ({
            state:
              DowngradeState
                .RESTRICTED,

            persistedState:
              DowngradeState
                .RESTRICTED,

            graceEndsAt:
              null,

            graceActive:
              false,
          }),
        );
    });

    it(
      'keeps a retained project writable after restricted overage',
      async () => {
        service
          .getOrCreateSubscription =
          jest.fn(
            async () => ({
              downgradeState:
                DowngradeState
                  .RESTRICTED,

              downgradeRetainedProjectIds:
                [
                  retainedProjectId,
                  ...otherRetainedProjectIds,
                ],
            }),
          );

        service
          .getEffectivePlanLimits =
          jest.fn(
            () => ({
              projects:
                10,
            }),
          );

        service
          .countOwnedProjectsForUser =
          jest.fn(
            async () => 12,
          );

        const result =
          await service
            .getProjectWriteAccess(
              retainedProjectId,
            );

        expect(
          result,
        ).toEqual(
          expect.objectContaining(
            {
              writable:
                true,

              reason:
                'allowed',

              retainedProject:
                true,

              overProjectLimit:
                true,

              downgradeState:
                DowngradeState
                  .RESTRICTED,
            },
          ),
        );

        expect(
          projectUpdate,
        ).not
          .toHaveBeenCalled();
      },
    );

    it(
      'makes an unretained excess project read-only while retention selection is incomplete',
      async () => {
        service
          .getOrCreateSubscription =
          jest.fn(
            async () => ({
              downgradeState:
                DowngradeState
                  .RESTRICTED,

              downgradeRetainedProjectIds:
                [
                  ...otherRetainedProjectIds,
                ],
            }),
          );

        service
          .getEffectivePlanLimits =
          jest.fn(
            () => ({
              projects:
                10,
            }),
          );

        service
          .countOwnedProjectsForUser =
          jest.fn(
            async () => 12,
          );

        const result =
          await service
            .getProjectWriteAccess(
              projectId,
            );

        expect(
          result,
        ).toEqual(
          expect.objectContaining(
            {
              writable:
                false,

              reason:
                'billing_selection_required',

              retainedProject:
                false,

              selectionRequired:
                true,
            },
          ),
        );

        expect(
          projectUpdate,
        ).not
          .toHaveBeenCalled();
      },
    );

    it(
      'uses billing_project_restricted once the retained project selection is complete',
      async () => {
        service
          .getOrCreateSubscription =
          jest.fn(
            async () => ({
              downgradeState:
                DowngradeState
                  .RESTRICTED,

              downgradeRetainedProjectIds:
                [
                  ...otherRetainedProjectIds,
                  '507f1f77bcf86cd799439031',
                ],
            }),
          );

        service
          .getEffectivePlanLimits =
          jest.fn(
            () => ({
              projects:
                10,
            }),
          );

        service
          .countOwnedProjectsForUser =
          jest.fn(
            async () => 12,
          );

        const result =
          await service
            .getProjectWriteAccess(
              projectId,
            );

        expect(
          result.writable,
        ).toBe(
          false,
        );

        expect(
          result.reason,
        ).toBe(
          'billing_project_restricted',
        );

        expect(
          result.selectionRequired,
        ).toBe(
          false,
        );
      },
    );

    it(
      'keeps a retained accepted member active after restricted member overage',
      async () => {
        service
          .getOrCreateSubscription =
          jest.fn(
            async () => ({
              downgradeState:
                DowngradeState
                  .RESTRICTED,

              downgradeRetainedMemberUserIds:
                [
                  retainedMemberId,
                ],
            }),
          );

        service
          .getEffectivePlanLimits =
          jest.fn(
            () => ({
              membersPerProject:
                2,
            }),
          );

        service
          .getAcceptedWorkspaceMemberSnapshot =
          jest.fn(
            async () => [
              {
                userId:
                  retainedMemberId,
              },
              {
                userId:
                  excessMemberId,
              },
            ],
          );

        const result =
          await service
            .getProjectMemberAccess(
              projectId,
              retainedMemberId,
            );

        expect(
          result,
        ).toEqual(
          expect.objectContaining(
            {
              active:
                true,

              retainedMember:
                true,

              isAcceptedMember:
                true,

              overMemberLimit:
                true,

              reason:
                'allowed',
            },
          ),
        );

        expect(
          projectUpdate,
        ).not
          .toHaveBeenCalled();
      },
    );

    it(
      'keeps an excess accepted member record but reports billing access inactive',
      async () => {
        service
          .getOrCreateSubscription =
          jest.fn(
            async () => ({
              downgradeState:
                DowngradeState
                  .RESTRICTED,

              downgradeRetainedMemberUserIds:
                [
                  retainedMemberId,
                ],
            }),
          );

        service
          .getEffectivePlanLimits =
          jest.fn(
            () => ({
              membersPerProject:
                2,
            }),
          );

        service
          .getAcceptedWorkspaceMemberSnapshot =
          jest.fn(
            async () => [
              {
                userId:
                  retainedMemberId,
              },
              {
                userId:
                  excessMemberId,
              },
            ],
          );

        const result =
          await service
            .getProjectMemberAccess(
              projectId,
              excessMemberId,
            );

        expect(
          result,
        ).toEqual(
          expect.objectContaining(
            {
              active:
                false,

              retainedMember:
                false,

              isAcceptedMember:
                true,

              reason:
                'billing_member_inactive',
            },
          ),
        );

        // Access evaluation is an overlay only:
        // it must not rewrite membership data.
        expect(
          projectUpdate,
        ).not
          .toHaveBeenCalled();
      },
    );

    it(
      'keeps the workspace owner active despite restricted member overage',
      async () => {
        service
          .getOrCreateSubscription =
          jest.fn(
            async () => ({
              downgradeState:
                DowngradeState
                  .RESTRICTED,

              downgradeRetainedMemberUserIds:
                [],
            }),
          );

        service
          .getEffectivePlanLimits =
          jest.fn(
            () => ({
              membersPerProject:
                1,
            }),
          );

        service
          .getAcceptedWorkspaceMemberSnapshot =
          jest.fn(
            async () => [
              {
                userId:
                  retainedMemberId,
              },
              {
                userId:
                  excessMemberId,
              },
            ],
          );

        const result =
          await service
            .getProjectMemberAccess(
              projectId,
              ownerId,
            );

        expect(
          result.active,
        ).toBe(
          true,
        );

        expect(
          result.isOwner,
        ).toBe(
          true,
        );

        expect(
          result.reason,
        ).toBe(
          'allowed',
        );
      },
    );

    it(
      'blocks a new workspace member while restricted over the Free member limit',
      async () => {
        service.projectModel = {
          find:
            jest.fn(
              () => ({
                select:
                  () => ({
                    lean:
                      () => ({
                        exec:
                          async () => [
                            {
                              ownerId,

                              members: [
                                {
                                  userId:
                                    retainedMemberId,
                                },
                                {
                                  userId:
                                    excessMemberId,
                                },
                              ],

                              invites:
                                [],
                            },
                          ],
                      }),
                  }),
              }),
          ),
      };

        service
          .getActiveWorkspaceOwnedProjectQuery =
          jest.fn(
            () => ({}),
          );

        service
          .getWorkspaceOwnerIdFromProject =
          jest.fn(
            () => ownerId,
          );

        service
          .getRefId =
          jest.fn(
            (value: any) =>
              String(value),
          );

        service
          .getOrCreateSubscription =
          jest.fn(
            async () => ({
              downgradeState:
                DowngradeState
                  .RESTRICTED,

              downgradeRetainedMemberUserIds:
                [
                  retainedMemberId,
                ],
            }),
          );

        service
          .getEffectivePlanLimits =
          jest.fn(
            () => ({
              membersPerProject:
                2,
            }),
          );

        const result =
          await service
            .checkWorkspaceMemberLimit(
              ownerId,
              {
                userId:
                  '507f1f77bcf86cd799439099',
              },
            );

        expect(
          result.allowed,
        ).toBe(
          false,
        );

        expect(
          result.limit,
        ).toBe(
          2,
        );

        expect(
          result.current,
        ).toBe(
          2,
        );
      },
    );

    it(
      'blocks storage growth when projected usage exceeds the active limit',
      async () => {
        const oneGb =
          1024 *
          1024 *
          1024;

        service
          .getOrCreateSubscription =
          jest.fn(
            async () => ({
              usage:
                {},
            }),
          );

        service
          .getEffectivePlanLimits =
          jest.fn(
            () => ({
              storageBytes:
                oneGb,
            }),
          );

        service
          .getOwnedStorageBytesForUser =
          jest.fn(
            async () =>
              oneGb -
              100,
          );

        const result =
          await service
            .checkLimit(
              ownerId,
              'storage',
              101,
            );

        expect(
          result,
        ).toEqual({
          allowed:
            false,

          current:
            oneGb - 100,

          limit:
            oneGb,

          remaining:
            100,
        });
      },
    );

    it(
      'binds project storage enforcement to the project owner subscription',
      async () => {
        const checkLimit =
          jest.fn(
            async () => ({
              allowed:
                false,

              current:
                1500,

              limit:
                1000,

              remaining:
                0,
            }),
          );

        service
          .checkLimit =
          checkLimit;

        const result =
          await service
            .checkProjectStorageLimit(
              projectId,
              25,
            );

        expect(
          checkLimit,
        ).toHaveBeenCalledWith(
          ownerId,
          'storage',
          25,
        );

        expect(
          result,
        ).toEqual(
          expect.objectContaining(
            {
              ownerUserId:
                ownerId,

              allowed:
                false,

              current:
                1500,

              limit:
                1000,
            },
          ),
        );
      },
    );

    it(
      'blocks the next AI generation when the monthly Free quota is exhausted',
      async () => {
        service
          .ensureCurrentAiUsageWindow =
          jest.fn(
            async () => ({
              usage: {
                aiCallsThisMonth:
                  100,
              },
            }),
          );

        service
          .getEffectivePlanLimits =
          jest.fn(
            () => ({
              aiCallsPerMonth:
                100,
            }),
          );

        const result =
          await service
            .checkLimit(
              ownerId,
              'aiCalls',
              1,
            );

        expect(
          result,
        ).toEqual({
          allowed:
            false,

          current:
            100,

          limit:
            100,

          remaining:
            0,
        });
      },
    );

    it(
      'allows the final AI call while one monthly Free quota slot remains',
      async () => {
        service
          .ensureCurrentAiUsageWindow =
          jest.fn(
            async () => ({
              usage: {
                aiCallsThisMonth:
                  99,
              },
            }),
          );

        service
          .getEffectivePlanLimits =
          jest.fn(
            () => ({
              aiCallsPerMonth:
                100,
            }),
          );

        const result =
          await service
            .checkLimit(
              ownerId,
              'aiCalls',
              1,
            );

        expect(
          result,
        ).toEqual({
          allowed:
            true,

          current:
            99,

          limit:
            100,

          remaining:
            1,
        });
      },
    );
  },
);
