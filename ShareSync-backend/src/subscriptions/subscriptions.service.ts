// src/subscriptions/subscriptions.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTIONS SERVICE - Business logic + Stripe integration
// Phase 5: Fair pricing with $39/month Team plan
// NOTE: Stripe is OPTIONAL - service works without it for local development
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Injectable,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Thread } from '../threads/schemas/thread.schema';
import { ThreadMessage } from '../thread-messages/schemas/thread-message.schema';
import { TeamRoomPendingUpload } from '../uploads/schemas/team-room-pending-upload.schema';
import { User } from '../user/schemas/user.schema';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  Subscription,
  SubscriptionDocument,
  SubscriptionPlan,
  SubscriptionStatus,
  BillingInterval,
  DowngradeState,
} from './schemas/subscription.schema';
import {
  CreateCheckoutDto,
  CheckoutPlan,
  CheckoutInterval,
  UpdateBudgetCapDto,
  UpdateBillingDetailsDto,
} from './dto';

// ═══════════════════════════════════════════════════════════════════════════════
// STRIPE TYPE DEFINITIONS (so we don't need the package installed)
// ═══════════════════════════════════════════════════════════════════════════════

// Minimal Stripe types for compilation without the stripe package
interface StripeCustomer {
  id: string;
}

interface StripeCheckoutSession {
  id: string;
  url: string | null;
  subscription: string | null;
  metadata?: Record<string, string>;
}

interface StripeSubscription {
  id: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at: number | null;
  cancel_at_period_end: boolean;
  metadata?: Record<string, string>;
}

interface StripeInvoice {
  id: string;
  subscription: string | null;
}

interface StripeBillingPortalSession {
  url: string;
}

interface StripeEvent {
  type: string;
  data: {
    object: any;
  };
}

// Stripe client interface
interface StripeClient {
  customers: {
    create: (params: any) => Promise<StripeCustomer>;
    retrieve: (id: string) => Promise<any>;
    del: (id: string) => Promise<any>;
  };
  checkout: {
    sessions: {
      create: (params: any) => Promise<StripeCheckoutSession>;
    };
  };
  subscriptions: {
    update: (id: string, params: any) => Promise<StripeSubscription>;
    cancel: (id: string, params?: any) => Promise<StripeSubscription>;
  };
  billingPortal: {
    sessions: {
      create: (params: any) => Promise<StripeBillingPortalSession>;
    };
  };
  webhooks: {
    constructEvent: (payload: any, signature: string, secret: string) => StripeEvent;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLAN CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export interface PlanConfig {
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  limits: {
    projects: number;
    membersPerProject: number;
    storageBytes: number;
    aiCallsPerMonth: number;
    maxWorkspaces: number;
  };
  features: string[];
}

export const PLAN_CONFIGS: Record<SubscriptionPlan, PlanConfig> = {
  [SubscriptionPlan.FREE]: {
    name: 'Free',
    description: 'For individuals & small groups',
    priceMonthly: 0,
    priceYearly: 0,
    limits: {
      projects: 10,
      membersPerProject: 10,
      storageBytes: 1 * 1024 * 1024 * 1024,
      aiCallsPerMonth: 100,
      maxWorkspaces: 3,
    },
    features: [
      'Up to 10 projects',
      '10 workspace members',
      '1GB storage',
      'Basic analytics',
      'Community support',
    ],
  },
  [SubscriptionPlan.TEAM]: {
    name: 'Team',
    description: 'For serious teams',
    priceMonthly: 3900,
    priceYearly: 39000,
    limits: {
      projects: 50,
      membersPerProject: 25,
      storageBytes: 10 * 1024 * 1024 * 1024,
      aiCallsPerMonth: 1000,
      maxWorkspaces: 10,
    },
    features: [
      'Up to 50 projects',
      '25 workspace members',
      '10GB storage',
      'Advanced analytics',
      'Priority support',
      'Org dashboard',
      'Custom branding',
    ],
  },
  [SubscriptionPlan.ENTERPRISE]: {
    name: 'Enterprise',
    description: 'For large organizations',
    priceMonthly: 0,
    priceYearly: 0,
    limits: {
      projects: -1,
      membersPerProject: -1,
      storageBytes: 100 * 1024 * 1024 * 1024,
      aiCallsPerMonth: -1,
      maxWorkspaces: -1,
    },
    features: [
      'Unlimited projects',
      'Unlimited members',
      '100GB+ storage',
      'SSO & audit logs',
      'Dedicated support',
      'Custom contracts',
      'SLA guarantee',
    ],
  },
};

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);
  private stripe: StripeClient | null = null;
  private stripeAvailable = false;

  constructor(
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<SubscriptionDocument>,
    private readonly eventEmitter: EventEmitter2,
    @InjectModel('Project')
    private readonly projectModel: Model<any>,

    // openshare-downgrade-member-display-v1
    // Used only to enrich the owner-facing downgrade member picker.
    // Capacity/access snapshots remain identity-only and side-effect free.
    @InjectModel(User.name)
    private readonly userModel: Model<any>,

    // openshare-entitlements-v1
    // VaultFile is already registered by SubscriptionsModule. Keeping this
    // model here lets billing/entitlements calculate authoritative owned
    // storage without depending on VaultService.
    @InjectModel('VaultFile')
    private readonly vaultFileModel: Model<any>,

    // openshare-team-room-storage-accounting-v1
    @InjectModel(Thread.name)
    private readonly threadModel: Model<any>,

    @InjectModel(ThreadMessage.name)
    private readonly threadMessageModel: Model<any>,

    @InjectModel(TeamRoomPendingUpload.name)
    private readonly teamRoomPendingUploadModel: Model<any>,
  ) {
    this.initializeStripe();
  }

  /**
   * Initialize Stripe if available
   */
  private async initializeStripe(): Promise<void> {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeKey) {
      this.logger.warn('STRIPE_SECRET_KEY not set - payment features disabled. This is OK for development.');
      return;
    }

    try {
      // Dynamically import Stripe only if key is available
      const Stripe = await import('stripe').catch(() => null);
      
      if (Stripe) {
        this.stripe = new Stripe.default(stripeKey, {
          apiVersion: '2023-10-16',
        }) as unknown as StripeClient;
        this.stripeAvailable = true;
        this.logger.log('Stripe initialized successfully');
      } else {
        this.logger.warn('Stripe package not installed - payment features disabled');
      }
    } catch (error) {
      this.logger.warn('Failed to initialize Stripe - payment features disabled:', error);
    }
  }

  /**
   * Check if Stripe is available
   */
  isStripeAvailable(): boolean {
    return this.stripeAvailable && this.stripe !== null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUBSCRIPTION MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  async getOrCreateSubscription(userId: string): Promise<SubscriptionDocument> {
    let subscription = await this.subscriptionModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!subscription) {
      const freeLimits = PLAN_CONFIGS[SubscriptionPlan.FREE].limits;

      subscription = await this.subscriptionModel.create({
        userId: new Types.ObjectId(userId),
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.ACTIVE,
        billingInterval: BillingInterval.MONTHLY,
        usage: {
          projects: 0,
          storage: 0,
          aiCalls: 0,
          aiCallsThisMonth: 0,
        },
        limits: freeLimits,
        activeMembers: 1,
      });

      this.logger.log(`Created free subscription for user ${userId}`);
    }

    return subscription;
  }

  async getByUserId(userId: string): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel.findOne({
      userId: new Types.ObjectId(userId),
    });
  }

  async getByStripeCustomerId(customerId: string): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel.findOne({ stripeCustomerId: customerId });
  }

  async getByStripeSubscriptionId(subscriptionId: string): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel.findOne({ stripeSubscriptionId: subscriptionId });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // USAGE & LIMITS
  // ═══════════════════════════════════════════════════════════════════════════


  // ─────────────────────────────────────────────────────────────────────────────
  // OWNED PROJECT CAPACITY COUNT
  // Project limits are attached to stable ownership, not current access
  // or operating status. Completed and archived projects continue to
  // consume capacity. Only permanent deletion releases a project slot.
  private getOwnedProjectUsageQuery(
    userId: string,
  ): Record<string, any> {
    const oid = new Types.ObjectId(userId);

    return {
      $or: [
        { ownerId: oid },
        { owner: oid },
        { createdBy: oid },
        { createdById: oid },

        // Backward-compatible ownership fields from older records.
        { creatorId: oid },
        { userId: oid },
      ],
    };
  }

  // openshare-project-capacity-query-v1
  //
  // Project-count capacity and storage ownership are intentionally different.
  //
  // Archived/deleted projects stop consuming a project slot so downgrade
  // overages can be resolved without destroying customer work. Their stored
  // files remain owned by the workspace and continue counting toward storage.
  //
  // Completed-but-unarchived projects still consume a project slot.
  private getOwnedProjectCapacityQuery(
    userId: string,
  ): Record<string, any> {
    return {
      ...this.getOwnedProjectUsageQuery(
        userId,
      ),

      isArchived: {
        $ne: true,
      },

      status: {
        $nin: [
          'archived',
          'deleted',
          'ARCHIVED',
          'DELETED',
        ],
      },
    };
  }

  async countOwnedProjectsForUser(
    userId: string,
  ): Promise<number> {
    return this.projectModel
      .countDocuments(
        this.getOwnedProjectCapacityQuery(userId),
      )
      .exec();
  }

  // openshare-entitlements-v1
  // Storage entitlement belongs to the workspace/project owner. Files from
  // projects where this user is only a collaborator must not consume this
  // user's subscription allowance. Archived/completed owned projects still
  // occupy storage and therefore remain included.
  async getOwnedStorageBytesForUser(
    userId: string,
  ): Promise<number> {
    const ownedProjectIds =
      await this.projectModel
        .distinct(
          '_id',
          this.getOwnedProjectUsageQuery(
            userId,
          ),
        )
        .exec();

    if (!ownedProjectIds.length) {
      return 0;
    }

    // openshare-team-room-storage-accounting-v1
    // openshare-team-room-asset-registry-v1
    //
    // Authoritative storage has two modern durable sources:
    //
    // 1. VaultFile rows.
    // 2. TeamRoomPendingUpload rows, which remain as durable upload-asset
    //    records after they are consumed into a message.
    //
    // Historical Team Room attachments created before the asset registry are
    // still counted directly from ThreadMessage.attachments. A historical
    // message attachment is counted only when its fileId has no registry row.
    // This prevents a modern attachment from being counted once as an asset
    // row and again as message display metadata.
    const [
      vaultRows,
      ownedThreadIds,
      trackedUploadRows,
      trackedFileIdsRaw,
    ] = await Promise.all([
      this.vaultFileModel
        .aggregate([
          {
            $match: {
              projectId: {
                $in:
                  ownedProjectIds,
              },
            },
          },
          {
            $group: {
              _id: null,
              totalBytes: {
                $sum: {
                  $ifNull: [
                    '$sizeInBytes',
                    {
                      $ifNull: [
                        '$size',
                        0,
                      ],
                    },
                  ],
                },
              },
            },
          },
        ])
        .exec(),

      this.threadModel
        .distinct(
          '_id',
          {
            projectId: {
              $in:
                ownedProjectIds,
            },
          },
        )
        .exec(),

      this.teamRoomPendingUploadModel
        .aggregate([
          {
            $match: {
              projectId: {
                $in:
                  ownedProjectIds,
              },
            },
          },
          {
            $group: {
              _id: null,
              totalBytes: {
                $sum: {
                  $ifNull: [
                    '$sizeInBytes',
                    0,
                  ],
                },
              },
            },
          },
        ])
        .exec(),

      this.teamRoomPendingUploadModel
        .distinct(
          'fileId',
          {
            projectId: {
              $in:
                ownedProjectIds,
            },
          },
        )
        .exec(),
    ]);

    const trackedFileIds =
      (
        Array.isArray(
          trackedFileIdsRaw,
        )
          ? trackedFileIdsRaw
          : []
      )
        .map(
          (value: any) =>
            String(
              value || '',
            ).trim(),
        )
        .filter(Boolean);

    let historicalThreadAttachmentBytes =
      0;

    if (
      Array.isArray(
        ownedThreadIds,
      ) &&
      ownedThreadIds.length > 0
    ) {
      const attachmentPipeline:
        any[] =
      [
        {
          $match: {
            threadId: {
              $in:
                ownedThreadIds,
            },
          },
        },
        {
          $unwind: {
            path:
              '$attachments',
            preserveNullAndEmptyArrays:
              false,
          },
        },
      ];

      if (
        trackedFileIds.length > 0
      ) {
        attachmentPipeline.push({
          $match: {
            'attachments.fileId': {
              $nin:
                trackedFileIds,
            },
          },
        });
      }

      attachmentPipeline.push({
        $group: {
          _id: null,
          totalBytes: {
            $sum: {
              $ifNull: [
                '$attachments.fileSize',
                0,
              ],
            },
          },
        },
      });

      const attachmentRows =
        await this.threadMessageModel
          .aggregate(
            attachmentPipeline,
          )
          .exec();

      historicalThreadAttachmentBytes =
        Number(
          attachmentRows?.[0]
            ?.totalBytes ||
            0,
        );
    }

    const vaultBytes =
      Number(
        vaultRows?.[0]
          ?.totalBytes ||
          0,
      );

    const trackedUploadBytes =
      Number(
        trackedUploadRows?.[0]
          ?.totalBytes ||
          0,
      );

    const safeVaultBytes =
      Number.isFinite(
        vaultBytes,
      )
        ? Math.max(
            0,
            vaultBytes,
          )
        : 0;

    const safeHistoricalThreadBytes =
      Number.isFinite(
        historicalThreadAttachmentBytes,
      )
        ? Math.max(
            0,
            historicalThreadAttachmentBytes,
          )
        : 0;

    const safeTrackedUploadBytes =
      Number.isFinite(
        trackedUploadBytes,
      )
        ? Math.max(
            0,
            trackedUploadBytes,
          )
        : 0;

    return (
      safeVaultBytes +
      safeHistoricalThreadBytes +
      safeTrackedUploadBytes
    );
  }

  // openshare-entitlement-enforcement-v1
  // Resolve the limits that actually govern access.
  //
  // Free accounts always use canonical PLAN_CONFIGS values so stale database
  // limits from an old paid subscription cannot leak into Free access.
  //
  // Paid accounts may retain explicitly stored limits so future negotiated
  // Enterprise/custom contracts continue to work.
  private getEffectivePlanLimits(
    subscription: SubscriptionDocument,
  ): PlanConfig['limits'] {
    const plan =
      (subscription.plan ||
        SubscriptionPlan.FREE) as SubscriptionPlan;

    const canonical =
      PLAN_CONFIGS[plan]?.limits ||
      PLAN_CONFIGS[SubscriptionPlan.FREE].limits;

    if (plan === SubscriptionPlan.FREE) {
      return {
        ...canonical,
      };
    }

    const stored: any =
      subscription.limits || {};

    return {
      projects:
        typeof stored.projects === 'number'
          ? stored.projects
          : canonical.projects,

      membersPerProject:
        typeof stored.membersPerProject === 'number'
          ? stored.membersPerProject
          : canonical.membersPerProject,

      storageBytes:
        typeof stored.storageBytes === 'number'
          ? stored.storageBytes
          : canonical.storageBytes,

      aiCallsPerMonth:
        typeof stored.aiCallsPerMonth === 'number'
          ? stored.aiCallsPerMonth
          : canonical.aiCallsPerMonth,

      maxWorkspaces:
        typeof stored.maxWorkspaces === 'number'
          ? stored.maxWorkspaces
          : canonical.maxWorkspaces,
    };
  }

  private getRefId(ref: any): string {
    if (!ref) return '';
    if (typeof ref === 'string') return ref;
    return String(ref?._id || ref?.id || ref || '');
  }

  private getWorkspaceOwnerIdFromProject(project: any): string {
    return [
      project?.ownerId,
      project?.owner,
      project?.createdBy,
      project?.createdById,
      project?.creatorId,
      project?.userId,
    ].map((ref) => this.getRefId(ref)).find(Boolean) || '';
  }

  private getActiveWorkspaceOwnedProjectQuery(ownerUserId: string): Record<string, any> {
    const oid = new Types.ObjectId(ownerUserId);
    const inactiveProjectStatuses = [
      'completed',
      'done',
      'archived',
      'deleted',
      'COMPLETED',
      'DONE',
      'ARCHIVED',
      'DELETED',
    ];

    return {
      $or: [
        { ownerId: oid },
        { owner: oid },
        { createdBy: oid },
        { createdById: oid },
        { creatorId: oid },
        { userId: oid },
      ],
      $and: [
        {
          $or: [
            { completedAt: { $exists: false } },
            { completedAt: null },
          ],
        },
      ],
      isArchived: { $ne: true },
      status: { $nin: inactiveProjectStatuses },
    };
  }

  // openshare-downgrade-member-selection-v1
  private async getAcceptedWorkspaceMemberSnapshot(
    ownerUserId: string,
  ): Promise<
    Array<{
      userId: string;
      projectIds: string[];
    }>
  > {
    if (
      !ownerUserId ||
      !Types.ObjectId.isValid(
        ownerUserId,
      )
    ) {
      throw new BadRequestException(
        'Invalid workspace owner ID',
      );
    }

    const normalizedOwnerUserId =
      new Types.ObjectId(
        ownerUserId,
      ).toString();

    const projects =
      await this.projectModel
        .find(
          this.getActiveWorkspaceOwnedProjectQuery(
            normalizedOwnerUserId,
          ),
        )
        .select(
          '_id ownerId owner createdBy createdById creatorId userId members',
        )
        .lean()
        .exec();

    const projectIdsByUser =
      new Map<
        string,
        Set<string>
      >();

    for (
      const project
      of projects
    ) {
      const projectId =
        String(
          (project as any)?._id ||
          '',
        ).trim();

      const projectMembers: any[] =
        Array.isArray(
          (project as any)?.members,
        )
          ? (project as any).members
          : [];

      for (
        const member
        of projectMembers
      ) {
        const memberUserId =
          this.getRefId(
            member?.userId ||
            member?.user ||
            member?.memberId ||
            member,
          );

        if (
          !memberUserId ||
          !Types.ObjectId.isValid(
            memberUserId,
          )
        ) {
          continue;
        }

        const normalizedMemberUserId =
          new Types.ObjectId(
            memberUserId,
          ).toString();

        if (
          normalizedMemberUserId ===
          normalizedOwnerUserId
        ) {
          continue;
        }

        let projectIds =
          projectIdsByUser.get(
            normalizedMemberUserId,
          );

        if (!projectIds) {
          projectIds =
            new Set<string>();

          projectIdsByUser.set(
            normalizedMemberUserId,
            projectIds,
          );
        }

        if (projectId) {
          projectIds.add(
            projectId,
          );
        }
      }
    }

    return Array.from(
      projectIdsByUser.entries(),
    )
      .map(
        (
          [
            userId,
            projectIds,
          ],
        ) => ({
          userId,

          projectIds:
            Array.from(
              projectIds,
            ).sort(),
        }),
      )
      .sort(
        (a, b) =>
          a.userId.localeCompare(
            b.userId,
          ),
      );
  }

  async checkWorkspaceMemberLimit(
    ownerUserId: string,
    candidate?: { userId?: string; email?: string },
  ): Promise<{ allowed: boolean; current: number; limit: number; remaining: number }> {
    const subscription =
      await this.getOrCreateSubscription(
        ownerUserId,
      );

    const limit =
      this.getEffectivePlanLimits(
        subscription,
      ).membersPerProject;

    const identities = new Set<string>();
    identities.add(`user:${ownerUserId}`);

    const projects = await this.projectModel
      .find(this.getActiveWorkspaceOwnedProjectQuery(ownerUserId))
      .select('ownerId owner createdBy createdById creatorId userId members invites')
      .lean()
      .exec();

    for (const project of projects) {
      const ownerId = this.getWorkspaceOwnerIdFromProject(project);
      if (ownerId) identities.add(`user:${ownerId}`);

      for (const member of project?.members || []) {
        const memberId = this.getRefId(member?.userId || member?.user || member?.memberId || member);
        if (memberId) identities.add(`user:${memberId}`);
      }

      for (const invite of project?.invites || []) {
        const status = String(invite?.status || '').toLowerCase();
        const email = String(invite?.email || '').trim().toLowerCase();
        const expiresAt = invite?.expiresAt ? new Date(invite.expiresAt).getTime() : null;

        if (email && status === 'pending' && (!expiresAt || expiresAt > Date.now())) {
          identities.add(`email:${email}`);
        }
      }
    }

    // openshare-downgrade-member-capacity-v1
    //
    // The existing identities set contains two fundamentally different kinds
    // of workspace identity:
    //
    //   user:*  = accepted workspace members
    //   email:* = still-pending invitations
    //
    // Billing never deletes either. During RESTRICTED member overage we only
    // change which accepted users consume active-member capacity.
    const acceptedUserIdentities =
      new Set<string>(
        Array.from(
          identities,
        ).filter(
          (identity) =>
            identity.startsWith(
              'user:',
            ),
        ),
      );

    const pendingInviteIdentities =
      new Set<string>(
        Array.from(
          identities,
        ).filter(
          (identity) =>
            identity.startsWith(
              'email:',
            ),
        ),
      );

    const acceptedWorkspaceMemberCount =
      acceptedUserIdentities.size;

    const downgrade =
      this.getEffectiveDowngradeState(
        subscription,
      );

    const overMemberLimit =
      acceptedWorkspaceMemberCount >
        limit;

    const restrictionActive =
      downgrade.state ===
        DowngradeState.RESTRICTED &&
      overMemberLimit;

    const normalizedOwnerUserId =
      Types.ObjectId.isValid(
        ownerUserId,
      )
        ? new Types.ObjectId(
            ownerUserId,
          ).toString()
        : String(
            ownerUserId ||
            '',
          ).trim();

    const ownerIdentity =
      `user:${normalizedOwnerUserId}`;

    /*
     * Only retained IDs that are still accepted members count as active.
     * Stale retained IDs are ignored without mutating the saved selection.
     */
    const retainedMemberUserIdentities =
      new Set<string>(
        (
          Array.isArray(
            subscription
              .downgradeRetainedMemberUserIds,
          )
            ? subscription
                .downgradeRetainedMemberUserIds
            : []
        )
          .map(
            (value) =>
              String(
                value ||
                '',
              ).trim(),
          )
          .filter(
            (value) =>
              Types.ObjectId.isValid(
                value,
              ),
          )
          .map(
            (value) =>
              new Types.ObjectId(
                value,
              ).toString(),
          )
          .map(
            (value) =>
              `user:${value}`,
          )
          .filter(
            (identity) =>
              identity !==
                ownerIdentity &&
              acceptedUserIdentities.has(
                identity,
              ),
          ),
      );

    const activeIdentities =
      new Set<string>();

    if (restrictionActive) {
      /*
       * Owner always remains active.
       */
      activeIdentities.add(
        ownerIdentity,
      );

      /*
       * Explicitly retained accepted users stay active.
       *
       * Every other accepted Project.members record remains stored but is
       * billing-inactive after the grace period.
       */
      for (
        const identity
        of retainedMemberUserIdentities
      ) {
        activeIdentities.add(
          identity,
        );
      }
    } else {
      /*
       * Paid, scheduled, grace, or non-over-limit:
       * preserve ordinary accepted-member behavior.
       */
      for (
        const identity
        of acceptedUserIdentities
      ) {
        activeIdentities.add(
          identity,
        );
      }
    }

    /*
     * Pending invitations are preserved and continue reserving capacity.
     * Downgrade does not revoke or delete them.
     */
    for (
      const identity
      of pendingInviteIdentities
    ) {
      activeIdentities.add(
        identity,
      );
    }

    const current =
      activeIdentities.size;

    /*
     * One candidate can be represented by userId, email, or both.
     * Supplying both still represents one prospective workspace member.
     */
    const candidateIdentities =
      new Set<string>();

    if (
      candidate?.userId
    ) {
      const rawUserId =
        String(
          candidate.userId ||
          '',
        ).trim();

      const normalizedCandidateUserId =
        Types.ObjectId.isValid(
          rawUserId,
        )
          ? new Types.ObjectId(
              rawUserId,
            ).toString()
          : rawUserId;

      if (
        normalizedCandidateUserId
      ) {
        candidateIdentities.add(
          `user:${normalizedCandidateUserId}`,
        );
      }
    }

    if (
      candidate?.email
    ) {
      const normalizedCandidateEmail =
        String(
          candidate.email ||
          '',
        )
          .trim()
          .toLowerCase();

      if (
        normalizedCandidateEmail
      ) {
        candidateIdentities.add(
          `email:${normalizedCandidateEmail}`,
        );
      }
    }

    const hasCandidate =
      candidateIdentities.size >
        0;

    const candidateAlreadyActiveOrReserved =
      Array.from(
        candidateIdentities,
      ).some(
        (identity) =>
          activeIdentities.has(
            identity,
          ),
      );

    const candidateAddsUniqueIdentity =
      hasCandidate &&
      !candidateAlreadyActiveOrReserved;

    const projected =
      current +
      (
        candidateAddsUniqueIdentity
          ? 1
          : 0
      );

    let allowed: boolean;

    if (!hasCandidate) {
      /*
       * Pure capacity query.
       */
      allowed =
        current <=
        limit;
    } else if (
      restrictionActive
    ) {
      /*
       * RESTRICTED overage:
       *
       * - owner / retained accepted user reused elsewhere -> allowed
       * - existing pending invite refreshed -> allowed
       * - new identity -> blocked
       * - non-retained accepted user -> blocked
       *
       * No retention selection is silently modified here.
       */
      allowed =
        candidateAlreadyActiveOrReserved;
    } else {
      // openshare-entitlement-enforcement-v1
      //
      // Preserve the existing graceful-overage rule outside RESTRICTED:
      // already-counted identities remain reusable, but overage cannot grow.
      allowed =
        !candidateAddsUniqueIdentity ||
        projected <=
          limit;
    }

    const remaining =
      Math.max(
        0,
        limit - current,
      );

    return {
      allowed,
      current,
      limit,
      remaining,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // openshare-entitlements-v1
  // CENTRALIZED SERVER-AUTHORITATIVE ENTITLEMENTS
  //
  // This method answers what an account may grow/create. It never deletes,
  // archives, removes, or otherwise mutates customer data.
  //
  // During downgrade grace, the target Free limits are already in effect
  // because Phase 1 changes plan -> FREE when paid access actually ends.
  // Existing over-limit data remains intact; growth beyond the active limit
  // is represented by canCreate/canInviteNew/canUpload/canUse = false.
  // ═══════════════════════════════════════════════════════════════════════════
  // openshare-project-write-entitlement-v1
  private getEffectiveDowngradeState(
    subscription: SubscriptionDocument,
  ): {
    state: DowngradeState;
    persistedState: DowngradeState;
    graceEndsAt: Date | null;
    graceActive: boolean;
  } {
    const persistedState =
      subscription.downgradeState ||
      DowngradeState.NONE;

    const graceEndsAt =
      subscription.downgradeGraceEndsAt
        ? new Date(
            subscription.downgradeGraceEndsAt,
          )
        : null;

    let state =
      persistedState;

    // Enforcement must remain correct even if a scheduler has not yet
    // persisted GRACE -> RESTRICTED. Expired or malformed grace fails closed.
    if (
      persistedState ===
        DowngradeState.GRACE &&
      (
        !graceEndsAt ||
        graceEndsAt.getTime() <=
          Date.now()
      )
    ) {
      state =
        DowngradeState.RESTRICTED;
    }

    const graceActive =
      state ===
        DowngradeState.GRACE &&
      Boolean(
        graceEndsAt &&
        graceEndsAt.getTime() >
          Date.now(),
      );

    return {
      state,
      persistedState,
      graceEndsAt,
      graceActive,
    };
  }

  // openshare-downgrade-member-access-v1
  //
  // Billing-only member access overlay.
  //
  // IMPORTANT:
  // This method does NOT grant ordinary project authorization.
  // Callers must first establish that the user can ordinarily access the
  // project. This evaluator answers only whether that already-authorized user
  // remains ACTIVE under the workspace owner's downgrade/member allowance.
  async getProjectMemberAccess(
    projectId: string,
    userId: string,
  ): Promise<{
    active: boolean;
    reason:
      | 'allowed'
      | 'billing_member_selection_required'
      | 'billing_member_inactive';
    ownerUserId: string;
    downgradeState: DowngradeState;
    memberLimit: number;
    acceptedWorkspaceMemberCount: number;
    overMemberLimit: boolean;
    retainedMember: boolean;
    selectionRequired: boolean;
    isOwner: boolean;
    isAcceptedMember: boolean;
  }> {
    if (
      !projectId ||
      !Types.ObjectId.isValid(
        projectId,
      )
    ) {
      throw new BadRequestException(
        'Invalid project ID',
      );
    }

    if (
      !userId ||
      !Types.ObjectId.isValid(
        userId,
      )
    ) {
      throw new BadRequestException(
        'Invalid user ID',
      );
    }

    const normalizedProjectId =
      new Types.ObjectId(
        projectId,
      ).toString();

    const normalizedUserId =
      new Types.ObjectId(
        userId,
      ).toString();

    const project =
      await this.projectModel
        .findById(
          new Types.ObjectId(
            normalizedProjectId,
          ),
        )
        .select(
          'ownerId owner createdBy createdById creatorId userId',
        )
        .lean()
        .exec();

    if (!project) {
      throw new BadRequestException(
        'Project not found',
      );
    }

    const rawOwnerUserId =
      this.getWorkspaceOwnerIdFromProject(
        project,
      );

    if (
      !rawOwnerUserId ||
      !Types.ObjectId.isValid(
        rawOwnerUserId,
      )
    ) {
      throw new BadRequestException(
        'Project owner could not be resolved',
      );
    }

    const ownerUserId =
      new Types.ObjectId(
        rawOwnerUserId,
      ).toString();

    const isOwner =
      normalizedUserId ===
      ownerUserId;

    /*
     * Owner access is immutable under member-overage handling.
     *
     * We still evaluate the subscription below so the response carries the
     * same useful billing metadata for owners and collaborators.
     */
    const subscription =
      await this.getOrCreateSubscription(
        ownerUserId,
      );

    const effectiveLimits =
      this.getEffectivePlanLimits(
        subscription,
      );

    const memberLimit =
      effectiveLimits.membersPerProject;

    const downgrade =
      this.getEffectiveDowngradeState(
        subscription,
      );

    const acceptedMembers =
      await this
        .getAcceptedWorkspaceMemberSnapshot(
          ownerUserId,
        );

    const acceptedUserIds =
      new Set<string>(
        acceptedMembers.map(
          (member) =>
            member.userId,
        ),
      );

    /*
     * getAcceptedWorkspaceMemberSnapshot() deliberately excludes the owner,
     * because the owner is implicit and consumes one slot.
     */
    const acceptedWorkspaceMemberCount =
      acceptedMembers.length + 1;

    const overMemberLimit =
      memberLimit !== -1 &&
      acceptedWorkspaceMemberCount >
        memberLimit;

    /*
     * Retention IDs must still be accepted workspace members.
     * Stale saved IDs are ignored without mutating the subscription.
     */
    const retainedMemberUserIds =
      new Set<string>(
        (
          Array.isArray(
            subscription
              .downgradeRetainedMemberUserIds,
          )
            ? subscription
                .downgradeRetainedMemberUserIds
            : []
        )
          .map(
            (value) =>
              String(
                value ||
                '',
              ).trim(),
          )
          .filter(
            (value) =>
              Types.ObjectId.isValid(
                value,
              ),
          )
          .map(
            (value) =>
              new Types.ObjectId(
                value,
              ).toString(),
          )
          .filter(
            (value) =>
              value !==
                ownerUserId &&
              acceptedUserIds.has(
                value,
              ),
          ),
      );

    const retainedMember =
      retainedMemberUserIds.has(
        normalizedUserId,
      );

    const isAcceptedMember =
      acceptedUserIds.has(
        normalizedUserId,
      );

    const selectableMemberLimit =
      memberLimit === -1
        ? null
        : Math.max(
            0,
            memberLimit - 1,
          );

    const requiredRetainedCount =
      overMemberLimit &&
      selectableMemberLimit !==
        null
        ? Math.min(
            selectableMemberLimit,
            acceptedMembers.length,
          )
        : 0;

    const restrictionActive =
      downgrade.state ===
        DowngradeState.RESTRICTED &&
      overMemberLimit;

    const selectionRequired =
      restrictionActive &&
      retainedMemberUserIds.size <
        requiredRetainedCount;

    /*
     * The workspace owner is always active.
     *
     * Before restriction, ordinary authorization remains unchanged.
     *
     * Once RESTRICTED while over the Free member allowance, explicitly
     * retained accepted members remain active. Other collaborator records are
     * preserved but the billing overlay reports them inactive.
     *
     * This intentionally means a legacy sharedWith/participantIds-only user
     * cannot bypass the retained-member list after restriction.
     */
    const active =
      isOwner ||
      !restrictionActive ||
      retainedMember;

    let reason:
      | 'allowed'
      | 'billing_member_selection_required'
      | 'billing_member_inactive' =
        'allowed';

    if (!active) {
      reason =
        selectionRequired
          ? 'billing_member_selection_required'
          : 'billing_member_inactive';
    }

    return {
      active,
      reason,
      ownerUserId,
      downgradeState:
        downgrade.state,
      memberLimit,
      acceptedWorkspaceMemberCount,
      overMemberLimit,
      retainedMember,
      selectionRequired,
      isOwner,
      isAcceptedMember,
    };
  }

  // openshare-project-restore-capacity-v1
  //
  // Restoring an archived project consumes one project-capacity slot.
  // Resolve billing ownership from the project itself rather than charging
  // the acting collaborator's subscription.
  async checkProjectActivationLimit(
    projectId: string,
    amount = 1,
  ): Promise<{
    allowed: boolean;
    current: number;
    limit: number;
    remaining: number;
    ownerUserId: string;
  }> {
    const access =
      await this.getProjectWriteAccess(
        projectId,
      );

    const usage =
      await this.checkLimit(
        access.ownerUserId,
        'projects',
        amount,
      );

    return {
      ownerUserId:
        access.ownerUserId,
      ...usage,
    };
  }

  async getProjectWriteAccess(
    projectId: string,
  ): Promise<{
    writable: boolean;
    reason:
      | 'allowed'
      | 'billing_selection_required'
      | 'billing_project_restricted';
    ownerUserId: string;
    downgradeState: DowngradeState;
    projectLimit: number;
    ownedProjectCount: number;
    overProjectLimit: boolean;
    retainedProject: boolean;
    selectionRequired: boolean;
  }> {
    if (
      !projectId ||
      !Types.ObjectId.isValid(projectId)
    ) {
      throw new BadRequestException(
        'Invalid project ID',
      );
    }

    const project =
      await this.projectModel
        .findById(
          new Types.ObjectId(projectId),
        )
        .select(
          'ownerId owner createdBy createdById creatorId userId',
        )
        .lean()
        .exec();

    if (!project) {
      throw new BadRequestException(
        'Project not found',
      );
    }

    const ownerUserId =
      this.getWorkspaceOwnerIdFromProject(
        project,
      );

    if (
      !ownerUserId ||
      !Types.ObjectId.isValid(
        ownerUserId,
      )
    ) {
      throw new BadRequestException(
        'Project owner could not be resolved',
      );
    }

    const subscription =
      await this.getOrCreateSubscription(
        ownerUserId,
      );

    const effectiveLimits =
      this.getEffectivePlanLimits(
        subscription,
      );

    const downgrade =
      this.getEffectiveDowngradeState(
        subscription,
      );

    const projectLimit =
      effectiveLimits.projects;

    const ownedProjectCount =
      await this.countOwnedProjectsForUser(
        ownerUserId,
      );

    const overProjectLimit =
      projectLimit !== -1 &&
      ownedProjectCount >
        projectLimit;

    const retainedProjectIds =
      Array.from(
        new Set(
          (
            Array.isArray(
              subscription
                .downgradeRetainedProjectIds,
            )
              ? subscription
                  .downgradeRetainedProjectIds
              : []
          )
            .map(
              (value) =>
                String(
                  value || '',
                ).trim(),
            )
            .filter(Boolean),
        ),
      );

    const normalizedProjectId =
      String(projectId);

    const retainedProject =
      retainedProjectIds.includes(
        normalizedProjectId,
      );

    const restrictionActive =
      downgrade.state ===
        DowngradeState.RESTRICTED &&
      overProjectLimit;

    const requiredRetainedCount =
      restrictionActive &&
      projectLimit !== -1
        ? Math.min(
            projectLimit,
            ownedProjectCount,
          )
        : 0;

    const selectionRequired =
      restrictionActive &&
      retainedProjectIds.length <
        requiredRetainedCount;

    const writable =
      !restrictionActive ||
      retainedProject;

    let reason:
      | 'allowed'
      | 'billing_selection_required'
      | 'billing_project_restricted' =
        'allowed';

    if (!writable) {
      reason =
        selectionRequired
          ? 'billing_selection_required'
          : 'billing_project_restricted';
    }

    return {
      writable,
      reason,
      ownerUserId,
      downgradeState:
        downgrade.state,
      projectLimit,
      ownedProjectCount,
      overProjectLimit,
      retainedProject,
      selectionRequired,
    };
  }

  // openshare-downgrade-project-selection-v1
  async getDowngradeProjectSelection(
    userId: string,
  ): Promise<{
    retainedProjectIds: string[];
    projectLimit: number;
    ownedProjectCount: number;
    overProjectLimit: boolean;
    requiredRetainedCount: number;
    remainingSelections: number | null;
    selectionRequired: boolean;
    selectionComplete: boolean;
    projects: Array<{
      id: string;
      name: string;
      status: string | null;
      isArchived: boolean;
      retained: boolean;
      updatedAt: Date | null;
    }>;
  }> {
    const subscription =
      await this.getOrCreateSubscription(
        userId,
      );

    // Selection is specifically for the post-downgrade Free allowance,
    // even when the account is still Team during a scheduled cancellation.
    const projectLimit =
      PLAN_CONFIGS[
        SubscriptionPlan.FREE
      ].limits.projects;

    const ownedProjects =
      await this.projectModel
        .find(
          this.getOwnedProjectCapacityQuery(
            userId,
          ),
        )
        .select(
          '_id name title status isArchived updatedAt',
        )
        .sort({
          updatedAt: -1,
          _id: 1,
        })
        .lean()
        .exec();

    const ownedProjectIds =
      new Set(
        ownedProjects.map(
          (project: any) =>
            String(project._id),
        ),
      );

    // A GET does not mutate stored billing state. It simply ignores stale
    // retained IDs whose Project documents are no longer owned/existent.
    const retainedProjectIds =
      Array.from(
        new Set(
          (
            Array.isArray(
              subscription
                .downgradeRetainedProjectIds,
            )
              ? subscription
                  .downgradeRetainedProjectIds
              : []
          )
            .map(
              (value) =>
                String(
                  value || '',
                ).trim(),
            )
            .filter(
              (value) =>
                Types.ObjectId.isValid(
                  value,
                ),
            )
            .map(
              (value) =>
                new Types.ObjectId(
                  value,
                ).toString(),
            )
            .filter(
              (value) =>
                ownedProjectIds.has(
                  value,
                ),
            ),
        ),
      );

    const retainedSet =
      new Set(
        retainedProjectIds,
      );

    const ownedProjectCount =
      ownedProjects.length;

    const overProjectLimit =
      projectLimit !== -1 &&
      ownedProjectCount >
        projectLimit;

    const requiredRetainedCount =
      overProjectLimit &&
      projectLimit !== -1
        ? Math.min(
            projectLimit,
            ownedProjectCount,
          )
        : 0;

    const remainingSelections =
      projectLimit === -1
        ? null
        : Math.max(
            0,
            requiredRetainedCount -
              retainedProjectIds.length,
          );

    const selectionRequired =
      overProjectLimit &&
      retainedProjectIds.length <
        requiredRetainedCount;

    return {
      retainedProjectIds,
      projectLimit,
      ownedProjectCount,
      overProjectLimit,
      requiredRetainedCount,
      remainingSelections,
      selectionRequired,
      selectionComplete:
        !selectionRequired,
      projects:
        ownedProjects.map(
          (project: any) => {
            const id =
              String(project._id);

            return {
              id,
              name:
                String(
                  project?.name ||
                    project?.title ||
                    'Untitled Project',
                ),
              status:
                project?.status
                  ? String(
                      project.status,
                    )
                  : null,
              isArchived:
                project?.isArchived ===
                true,
              retained:
                retainedSet.has(id),
              updatedAt:
                project?.updatedAt
                  ? new Date(
                      project.updatedAt,
                    )
                  : null,
            };
          },
        ),
    };
  }

  async updateDowngradeProjectSelection(
    userId: string,
    projectIds: unknown,
  ): Promise<{
    retainedProjectIds: string[];
    projectLimit: number;
    ownedProjectCount: number;
    overProjectLimit: boolean;
    requiredRetainedCount: number;
    remainingSelections: number | null;
    selectionRequired: boolean;
    selectionComplete: boolean;
    projects: Array<{
      id: string;
      name: string;
      status: string | null;
      isArchived: boolean;
      retained: boolean;
      updatedAt: Date | null;
    }>;
  }> {
    if (!Array.isArray(projectIds)) {
      throw new BadRequestException(
        'projectIds must be an array',
      );
    }

    const normalizedProjectIds =
      Array.from(
        new Set(
          projectIds.map(
            (value) => {
              const raw =
                String(
                  value || '',
                ).trim();

              if (
                !raw ||
                !Types.ObjectId.isValid(
                  raw,
                )
              ) {
                throw new BadRequestException(
                  'Every projectId must be a valid project ID',
                );
              }

              return new Types.ObjectId(
                raw,
              ).toString();
            },
          ),
        ),
      );

    const projectLimit =
      PLAN_CONFIGS[
        SubscriptionPlan.FREE
      ].limits.projects;

    if (
      projectLimit !== -1 &&
      normalizedProjectIds.length >
        projectLimit
    ) {
      throw new BadRequestException(
        `You can retain at most ${projectLimit} projects on the Free plan`,
      );
    }

    if (
      normalizedProjectIds.length >
      0
    ) {
      const ownedSelectedIds =
        await this.projectModel
          .distinct(
            '_id',
            {
              ...this.getOwnedProjectCapacityQuery(
                userId,
              ),
              _id: {
                $in:
                  normalizedProjectIds.map(
                    (id) =>
                      new Types.ObjectId(
                        id,
                      ),
                  ),
              },
            },
          )
          .exec();

      const ownedSelectedIdSet =
        new Set(
          ownedSelectedIds.map(
            (id: any) =>
              String(id),
          ),
        );

      const hasUnownedProject =
        normalizedProjectIds.some(
          (id) =>
            !ownedSelectedIdSet.has(
              id,
            ),
        );

      if (hasUnownedProject) {
        throw new BadRequestException(
          'Every retained project must be owned by your account',
        );
      }
    }

    const subscription =
      await this.getOrCreateSubscription(
        userId,
      );

    subscription
      .downgradeRetainedProjectIds =
        normalizedProjectIds;

    await subscription.save();

    return this
      .getDowngradeProjectSelection(
        userId,
      );
  }

  // openshare-workspace-member-metric-v1
  //
  // Canonical owner-workspace accepted-member count for billing UI.
  //
  // Reuse the same accepted-member snapshot as downgrade enforcement:
  // - accepted users are deduplicated across owned workspace projects
  // - pending invites are excluded
  // - the implicit owner is excluded by the snapshot and added once here
  async getAcceptedWorkspaceMemberCount(
    ownerUserId: string,
  ): Promise<number> {
    if (
      !ownerUserId ||
      !Types.ObjectId.isValid(
        ownerUserId,
      )
    ) {
      throw new BadRequestException(
        'Invalid user ID',
      );
    }

    const normalizedOwnerUserId =
      new Types.ObjectId(
        ownerUserId,
      ).toString();

    const acceptedMembers =
      await this
        .getAcceptedWorkspaceMemberSnapshot(
          normalizedOwnerUserId,
        );

    return acceptedMembers.length + 1;
  }


  async getDowngradeMemberSelection(
    userId: string,
  ): Promise<{
    retainedMemberUserIds: string[];
    memberLimit: number;
    selectableMemberLimit: number | null;
    ownerUserId: string;
    ownerConsumesSlot: true;
    acceptedMemberCount: number;
    acceptedWorkspaceMemberCount: number;
    overMemberLimit: boolean;
    requiredRetainedCount: number;
    remainingSelections: number | null;
    selectionRequired: boolean;
    selectionComplete: boolean;
    members: Array<{
      userId: string;
      projectIds: string[];
      retained: boolean;
      email: string;
      username: string;
      firstName: string;
      lastName: string;
      displayName: string;
      profilePicture: string | null;
    }>;
  }> {
    if (
      !userId ||
      !Types.ObjectId.isValid(
        userId,
      )
    ) {
      throw new BadRequestException(
        'Invalid user ID',
      );
    }

    const normalizedOwnerUserId =
      new Types.ObjectId(
        userId,
      ).toString();

    const subscription =
      await this.getOrCreateSubscription(
        normalizedOwnerUserId,
      );

    /*
     * Selection targets the post-downgrade Free allowance even while the
     * account is still Team/SCHEDULED before paid access ends.
     */
    const memberLimit =
      PLAN_CONFIGS[
        SubscriptionPlan.FREE
      ].limits.membersPerProject;

    const selectableMemberLimit =
      memberLimit === -1
        ? null
        : Math.max(
            0,
            memberLimit - 1,
          );

    const members =
      await this
        .getAcceptedWorkspaceMemberSnapshot(
          normalizedOwnerUserId,
        );

    // openshare-downgrade-member-display-v1
    //
    // One bulk lookup avoids N+1 frontend/profile requests while keeping the
    // canonical membership/capacity snapshot itself IDs-only.
    const memberProfiles =
      members.length > 0
        ? await this.userModel
            .find({
              _id: {
                $in:
                  members.map(
                    (member) =>
                      new Types.ObjectId(
                        member.userId,
                      ),
                  ),
              },
            })
            .select(
              '_id email username firstName lastName displayName profilePicture',
            )
            .lean()
            .exec()
        : [];

    const memberProfileByUserId =
      new Map<string, any>(
        memberProfiles.map(
          (profile: any) => [
            String(
              profile?._id ||
              '',
            ),
            profile,
          ],
        ),
      );

    const acceptedMemberUserIds =
      new Set(
        members.map(
          (member) =>
            member.userId,
        ),
      );

    /*
     * GET never mutates the saved selection.
     *
     * Stale IDs simply disappear from the effective result if that person is
     * no longer an accepted workspace member.
     */
    const retainedMemberUserIds =
      Array.from(
        new Set(
          (
            Array.isArray(
              subscription
                .downgradeRetainedMemberUserIds,
            )
              ? subscription
                  .downgradeRetainedMemberUserIds
              : []
          )
            .map(
              (value) =>
                String(
                  value ||
                  '',
                ).trim(),
            )
            .filter(
              (value) =>
                Types.ObjectId.isValid(
                  value,
                ),
            )
            .map(
              (value) =>
                new Types.ObjectId(
                  value,
                ).toString(),
            )
            .filter(
              (value) =>
                acceptedMemberUserIds.has(
                  value,
                ),
            ),
        ),
      );

    const retainedSet =
      new Set(
        retainedMemberUserIds,
      );

    const acceptedMemberCount =
      members.length;

    /*
     * Owner always remains active and consumes one workspace-member slot.
     */
    const acceptedWorkspaceMemberCount =
      acceptedMemberCount + 1;

    const overMemberLimit =
      memberLimit !== -1 &&
      acceptedWorkspaceMemberCount >
        memberLimit;

    const requiredRetainedCount =
      overMemberLimit &&
      selectableMemberLimit !==
        null
        ? Math.min(
            selectableMemberLimit,
            acceptedMemberCount,
          )
        : 0;

    const remainingSelections =
      selectableMemberLimit ===
        null
        ? null
        : Math.max(
            0,
            requiredRetainedCount -
              retainedMemberUserIds.length,
          );

    const selectionRequired =
      overMemberLimit &&
      retainedMemberUserIds.length <
        requiredRetainedCount;

    return {
      retainedMemberUserIds,
      memberLimit,
      selectableMemberLimit,

      ownerUserId:
        normalizedOwnerUserId,

      ownerConsumesSlot:
        true,

      acceptedMemberCount,
      acceptedWorkspaceMemberCount,
      overMemberLimit,
      requiredRetainedCount,
      remainingSelections,
      selectionRequired,

      selectionComplete:
        !selectionRequired,

      members:
        members.map(
          (member) => {
            const profile =
              memberProfileByUserId.get(
                member.userId,
              );

            const email =
              String(
                profile?.email ||
                '',
              ).trim();

            const username =
              String(
                profile?.username ||
                '',
              ).trim();

            const firstName =
              String(
                profile?.firstName ||
                '',
              ).trim();

            const lastName =
              String(
                profile?.lastName ||
                '',
              ).trim();

            const storedDisplayName =
              String(
                profile?.displayName ||
                '',
              ).trim();

            const fullName =
              [
                firstName,
                lastName,
              ]
                .filter(Boolean)
                .join(' ')
                .trim();

            const displayName =
              storedDisplayName ||
              fullName ||
              username ||
              email ||
              'Member';

            const profilePictureRaw =
              String(
                profile?.profilePicture ||
                '',
              ).trim();

            return {
              ...member,

              retained:
                retainedSet.has(
                  member.userId,
                ),

              email,
              username,
              firstName,
              lastName,
              displayName,

              profilePicture:
                profilePictureRaw ||
                null,
            };
          },
        ),
    };
  }

  async updateDowngradeMemberSelection(
    userId: string,
    rawMemberUserIds: unknown,
  ): Promise<
    Awaited<
      ReturnType<
        SubscriptionsService[
          'getDowngradeMemberSelection'
        ]
      >
    >
  > {
    if (
      !userId ||
      !Types.ObjectId.isValid(
        userId,
      )
    ) {
      throw new BadRequestException(
        'Invalid user ID',
      );
    }

    if (
      !Array.isArray(
        rawMemberUserIds,
      )
    ) {
      throw new BadRequestException(
        'memberUserIds must be an array',
      );
    }

    const normalizedOwnerUserId =
      new Types.ObjectId(
        userId,
      ).toString();

    const normalizedMemberUserIds =
      Array.from(
        new Set(
          rawMemberUserIds.map(
            (value) => {
              const raw =
                String(
                  value ||
                  '',
                ).trim();

              if (
                !Types.ObjectId.isValid(
                  raw,
                )
              ) {
                throw new BadRequestException(
                  'Every retained member ID must be a valid user ID',
                );
              }

              return new Types.ObjectId(
                raw,
              ).toString();
            },
          ),
        ),
      );

    /*
     * Owner is never part of the retained-member picker because the owner is
     * implicitly active.
     */
    if (
      normalizedMemberUserIds.includes(
        normalizedOwnerUserId,
      )
    ) {
      throw new BadRequestException(
        'The workspace owner is always active and must not be selected as a retained member',
      );
    }

    const memberLimit =
      PLAN_CONFIGS[
        SubscriptionPlan.FREE
      ].limits.membersPerProject;

    const selectableMemberLimit =
      memberLimit === -1
        ? -1
        : Math.max(
            0,
            memberLimit - 1,
          );

    if (
      selectableMemberLimit !== -1 &&
      normalizedMemberUserIds.length >
        selectableMemberLimit
    ) {
      throw new BadRequestException(
        `You can retain at most ${selectableMemberLimit} additional workspace members on the Free plan`,
      );
    }

    const acceptedMembers =
      await this
        .getAcceptedWorkspaceMemberSnapshot(
          normalizedOwnerUserId,
        );

    const acceptedMemberUserIds =
      new Set(
        acceptedMembers.map(
          (member) =>
            member.userId,
        ),
      );

    const hasUnknownMember =
      normalizedMemberUserIds.some(
        (memberUserId) =>
          !acceptedMemberUserIds.has(
            memberUserId,
          ),
      );

    if (hasUnknownMember) {
      throw new BadRequestException(
        'Every retained member must already be an accepted member of this workspace',
      );
    }

    const subscription =
      await this.getOrCreateSubscription(
        normalizedOwnerUserId,
      );

    subscription
      .downgradeRetainedMemberUserIds =
        normalizedMemberUserIds;

    await subscription.save();

    return this
      .getDowngradeMemberSelection(
        normalizedOwnerUserId,
      );
  }

  async getEntitlements(
    userId: string,
  ): Promise<{
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    downgrade: {
      state: DowngradeState;
      persistedState: DowngradeState;
      targetPlan: SubscriptionPlan | null;
      effectiveAt: Date | null;
      graceEndsAt: Date | null;
      graceActive: boolean;
      restricted: boolean;
    };
    projects: {
      current: number;
      limit: number;
      remaining: number | null;
      overLimit: boolean;
      canCreate: boolean;
    };
    members: {
      current: number;
      limit: number;
      remaining: number | null;
      overLimit: boolean;
      canInviteNew: boolean;
    };
    storage: {
      currentBytes: number;
      limitBytes: number;
      remainingBytes: number | null;
      overLimit: boolean;
      canUpload: boolean;
    };
    ai: {
      usedThisMonth: number;
      limitPerMonth: number;
      remaining: number | null;
      overLimit: boolean;
      canUse: boolean;
    };
  }> {
    const subscription =
      await this.getOrCreateSubscription(userId);

    const plan =
      subscription.plan ||
      SubscriptionPlan.FREE;

    const effectiveLimits =
      this.getEffectivePlanLimits(
        subscription,
      );

    const projectLimit =
      effectiveLimits.projects;

    const memberLimit =
      effectiveLimits.membersPerProject;

    const storageLimit =
      effectiveLimits.storageBytes;

    const aiLimit =
      effectiveLimits.aiCallsPerMonth;

    const [
      projectCurrent,
      memberUsage,
      storageCurrent,
    ] = await Promise.all([
      this.countOwnedProjectsForUser(userId),
      this.checkWorkspaceMemberLimit(userId),
      this.getOwnedStorageBytesForUser(userId),
    ]);

    const memberCurrent =
      Number(memberUsage.current || 0);

    const aiUsed =
      Number(
        subscription.usage?.aiCallsThisMonth ||
          0,
      );

    const downgrade =
      this.getEffectiveDowngradeState(
        subscription,
      );

    const persistedState =
      downgrade.persistedState;

    const graceEndsAt =
      downgrade.graceEndsAt;

    const effectiveState =
      downgrade.state;

    const graceActive =
      downgrade.graceActive;

    const finiteRemaining = (
      current: number,
      limit: number,
    ): number | null =>
      limit === -1
        ? null
        : Math.max(
            0,
            limit - current,
          );

    const isOver = (
      current: number,
      limit: number,
    ): boolean =>
      limit !== -1 &&
      current > limit;

    const canAddOne = (
      current: number,
      limit: number,
    ): boolean =>
      limit === -1 ||
      current + 1 <= limit;

    return {
      plan,
      status: subscription.status,

      downgrade: {
        state: effectiveState,
        persistedState,
        targetPlan:
          subscription.downgradeTargetPlan ||
          null,
        effectiveAt:
          subscription.downgradeEffectiveAt
            ? new Date(
                subscription.downgradeEffectiveAt,
              )
            : null,
        graceEndsAt,
        graceActive,
        restricted:
          effectiveState ===
          DowngradeState.RESTRICTED,
      },

      projects: {
        current: projectCurrent,
        limit: projectLimit,
        remaining:
          finiteRemaining(
            projectCurrent,
            projectLimit,
          ),
        overLimit:
          isOver(
            projectCurrent,
            projectLimit,
          ),
        canCreate:
          canAddOne(
            projectCurrent,
            projectLimit,
          ),
      },

      members: {
        current: memberCurrent,
        limit: memberLimit,
        remaining:
          finiteRemaining(
            memberCurrent,
            memberLimit,
          ),
        overLimit:
          isOver(
            memberCurrent,
            memberLimit,
          ),
        canInviteNew:
          canAddOne(
            memberCurrent,
            memberLimit,
          ),
      },

      storage: {
        currentBytes: storageCurrent,
        limitBytes: storageLimit,
        remainingBytes:
          finiteRemaining(
            storageCurrent,
            storageLimit,
          ),
        overLimit:
          isOver(
            storageCurrent,
            storageLimit,
          ),
        // This means at least some new storage remains available.
        // Phase 2C will validate each incoming file's exact byte size.
        canUpload:
          storageLimit === -1 ||
          storageCurrent < storageLimit,
      },

      ai: {
        usedThisMonth: aiUsed,
        limitPerMonth: aiLimit,
        remaining:
          finiteRemaining(
            aiUsed,
            aiLimit,
          ),
        overLimit:
          isOver(
            aiUsed,
            aiLimit,
          ),
        canUse:
          canAddOne(
            aiUsed,
            aiLimit,
          ),
      },
    };
  }

  // openshare-project-storage-owner-check-v1
  // Storage entitlement belongs to the project owner. A collaborator
  // uploading into another person's project therefore consumes the
  // owner's storage allowance, not the collaborator's allowance.
  async checkProjectStorageLimit(
    projectId: string,
    incomingFileBytes = 0,
  ): Promise<{
    ownerUserId: string;
    allowed: boolean;
    current: number;
    limit: number;
    remaining: number;
  }> {
    if (
      !projectId ||
      !Types.ObjectId.isValid(projectId)
    ) {
      throw new BadRequestException(
        'Invalid project ID',
      );
    }

    const project =
      await this.projectModel
        .findById(
          new Types.ObjectId(projectId),
        )
        .select(
          'ownerId owner createdBy createdById creatorId userId',
        )
        .lean()
        .exec();

    if (!project) {
      throw new BadRequestException(
        'Project not found',
      );
    }

    const ownerUserId =
      this.getWorkspaceOwnerIdFromProject(
        project,
      );

    if (
      !ownerUserId ||
      !Types.ObjectId.isValid(ownerUserId)
    ) {
      throw new BadRequestException(
        'Project owner could not be resolved',
      );
    }

    const numericBytes =
      Number(incomingFileBytes);

    const safeIncomingBytes =
      Number.isFinite(numericBytes)
        ? Math.max(
            0,
            numericBytes,
          )
        : 0;

    const usage =
      await this.checkLimit(
        ownerUserId,
        'storage',
        safeIncomingBytes,
      );

    return {
      ownerUserId,
      ...usage,
    };
  }

  // openshare-ai-monthly-rollover-v1
  //
  // AI allowance is calendar-month based. Rollover is lazy and
  // server-authoritative so a missed scheduler can never strand a user at
  // the previous month's quota. UTC gives every request the same boundary.
  //
  // The conditional update makes concurrent first-of-month requests safe:
  // only a stale/missing usage window can be reset.
  private async ensureCurrentAiUsageWindow(
    userId: string,
  ): Promise<SubscriptionDocument> {
    const subscription =
      await this.getOrCreateSubscription(
        userId,
      );

    const now = new Date();

    const monthStart =
      new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          1,
          0,
          0,
          0,
          0,
        ),
      );

    const rawResetAt =
      subscription.usage
        ?.aiCallsResetAt;

    const resetAt =
      rawResetAt instanceof Date
        ? rawResetAt
        : rawResetAt
          ? new Date(
              String(rawResetAt),
            )
          : null;

    const resetIsCurrent =
      Boolean(
        resetAt &&
          !Number.isNaN(
            resetAt.getTime(),
          ) &&
          resetAt.getTime() >=
            monthStart.getTime(),
      );

    if (resetIsCurrent) {
      return subscription;
    }

    await this.subscriptionModel.updateOne(
      {
        _id: subscription._id,
        $or: [
          {
            'usage.aiCallsResetAt': {
              $exists: false,
            },
          },
          {
            'usage.aiCallsResetAt':
              null,
          },
          {
            'usage.aiCallsResetAt': {
              $lt: monthStart,
            },
          },
        ],
      },
      {
        $set: {
          'usage.aiCallsThisMonth':
            0,
          'usage.aiCallsResetAt':
            now,
        },
      },
    );

    /*
     * Always reload after the conditional rollover attempt.
     *
     * If another request won the rollover race, this gives us that request's
     * fresh window instead of continuing with our stale pre-reset document.
     */
    const refreshed =
      await this.subscriptionModel
        .findById(
          subscription._id,
        );

    if (!refreshed) {
      throw new InternalServerErrorException(
        'Subscription could not be reloaded after AI usage rollover',
      );
    }

    return refreshed;
  }

  async checkLimit(
    userId: string,
    resource: 'projects' | 'storage' | 'aiCalls',
    amount = 1,
  ): Promise<{ allowed: boolean; current: number; limit: number; remaining: number }> {
    const subscription =
      resource === 'aiCalls'
        ? await this.ensureCurrentAiUsageWindow(
            userId,
          )
        : await this.getOrCreateSubscription(
            userId,
          );

    const effectiveLimits =
      this.getEffectivePlanLimits(
        subscription,
      );

    let limit: number;
    let current: number;

    switch (resource) {
      case 'projects':
        limit =
          effectiveLimits.projects;
        current =
          await this.countOwnedProjectsForUser(
            userId,
          );
        break;

      case 'storage':
        limit =
          effectiveLimits.storageBytes;
        current =
          await this.getOwnedStorageBytesForUser(
            userId,
          );
        break;

      case 'aiCalls':
        limit =
          effectiveLimits.aiCallsPerMonth;
        current =
          subscription.usage
            ?.aiCallsThisMonth ||
          0;
        break;

      default:
        throw new BadRequestException(
          `Unknown resource: ${resource}`,
        );
    }

    const allowed = limit === -1 || (current + amount) <= limit;
    const remaining = limit === -1 ? Infinity : Math.max(0, limit - current);

    return { allowed, current, limit, remaining };
  }

  async incrementUsage(
    userId: string,
    resource: 'projects' | 'storage' | 'aiCalls',
    amount = 1,
  ): Promise<void> {
    if (resource === 'aiCalls') {
      /*
       * Generation may cross the UTC month boundary after its preflight.
       * Re-check the usage window immediately before recording the successful
       * call so a new-month call is never written into the old month.
       */
      await this.ensureCurrentAiUsageWindow(
        userId,
      );
    } else {
      await this.getOrCreateSubscription(
        userId,
      );
    }

    const safeAmount = Number.isFinite(amount) ? amount : 1;
    const inc: Record<string, number> = {};

    if (resource === 'aiCalls') {
      inc['usage.aiCallsThisMonth'] = safeAmount;
      inc['usage.aiCalls'] = safeAmount;
    } else {
      inc[`usage.${resource}`] = safeAmount;
    }

    await this.subscriptionModel.updateOne(
      { userId: new Types.ObjectId(userId) },
      { $inc: inc },
    );
  }

  async decrementUsage(
    userId: string,
    resource: 'projects' | 'storage',
    amount = 1,
  ): Promise<void> {
    await this.subscriptionModel.updateOne(
      { userId: new Types.ObjectId(userId) },
      { $inc: { [`usage.${resource}`]: -Math.abs(amount) } },
    );
  }

  async resetMonthlyAiCalls(userId: string): Promise<void> {
    await this.subscriptionModel.updateOne(
      { userId: new Types.ObjectId(userId) },
      {
        $set: {
          'usage.aiCallsThisMonth': 0,
          'usage.aiCallsResetAt': new Date(),
        },
      },
    );
  }

  async getUsageAndLimits(userId: string): Promise<{
    usage: SubscriptionDocument['usage'];
    limits: SubscriptionDocument['limits'];
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
  }> {
    const subscription = await this.getOrCreateSubscription(userId);

    return {
      usage: subscription.usage,
      limits: subscription.limits,
      plan: subscription.plan,
      status: subscription.status,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STRIPE CHECKOUT (requires Stripe)
  // ═══════════════════════════════════════════════════════════════════════════

  async createCheckoutSession(
    userId: string,
    dto: CreateCheckoutDto,
  ): Promise<{ url: string; sessionId: string }> {
    if (!this.isStripeAvailable()) {
      throw new InternalServerErrorException(
        'Payment system not configured. Please set STRIPE_SECRET_KEY and install the stripe package.',
      );
    }

    const subscription = await this.getOrCreateSubscription(userId);

    // openshare-stripe-live-customer-self-heal-v1
    // A customer ID created in Stripe test mode does not exist in live mode.
    // Validate the stored customer against the currently configured Stripe
    // account and transparently replace stale IDs before starting Checkout.
    let customerId = subscription.stripeCustomerId;

    try {
      if (customerId) {
        try {
          const existingCustomer =
            await this.stripe!.customers.retrieve(customerId);

          if (existingCustomer?.deleted === true) {
            this.logger.warn(
              `Stored Stripe customer ${customerId} is deleted; creating a replacement for user ${userId}`,
            );
            customerId = undefined;
          }
        } catch (error: any) {
          const stripeErrorCode = String(error?.code || '');
          const stripeErrorMessage = String(error?.message || '');

          const isMissingCustomer =
            stripeErrorCode === 'resource_missing' ||
            /No such customer/i.test(stripeErrorMessage);

          if (!isMissingCustomer) {
            throw error;
          }

          this.logger.warn(
            `Stored Stripe customer ${customerId} does not exist in the active Stripe environment; creating a replacement for user ${userId}`,
          );

          customerId = undefined;
        }
      }

      if (!customerId) {
        const customer = await this.stripe!.customers.create({
          metadata: {
            userId,
            shareSync: 'true',
          },
        });

        customerId = customer.id;

        await this.subscriptionModel.updateOne(
          { userId: new Types.ObjectId(userId) },
          { stripeCustomerId: customerId },
        );

        this.logger.log(
          `Stored Stripe customer ${customerId} for user ${userId}`,
        );
      }
    } catch (error: any) {
      this.logger.error(
        `Stripe Customer Resolution Error: ${error.message}`,
        error.stack,
      );

      throw new InternalServerErrorException(
        `Could not create billing account: ${error.message}`,
      );
    }

    const priceId = this.getPriceId(dto.plan, dto.interval || CheckoutInterval.MONTHLY);
    if (!priceId) {
      throw new BadRequestException(`No price configured for plan: ${dto.plan} (${dto.interval})`);
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const successUrl = dto.successUrl || `${frontendUrl}/settings?subscription=success`;
    const cancelUrl = dto.cancelUrl || `${frontendUrl}/settings?subscription=canceled`;

    try {
      const session = await this.stripe!.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId,
          plan: dto.plan,
          interval: dto.interval || CheckoutInterval.MONTHLY,
        },
        subscription_data: {
          metadata: {
            userId,
            plan: dto.plan,
          },
        },
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        // TAX DISABLED: Often causes 500 errors on unconfigured test accounts
      });

      this.logger.log(`Created checkout session ${session.id} for user ${userId}`);

      return {
        url: session.url!,
        sessionId: session.id,
      };
    } catch (error: any) {
      this.logger.error(`Stripe Checkout Session Error: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Could not start checkout: ${error.message}`);
    }
  }

  async createPortalSession(userId: string): Promise<{ url: string }> {
    if (!this.isStripeAvailable()) {
      throw new InternalServerErrorException('Payment system not configured');
    }

    const subscription = await this.getOrCreateSubscription(userId);

    if (!subscription.stripeCustomerId) {
      throw new BadRequestException('No billing account found. Please subscribe first.');
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    try {
      const session = await this.stripe!.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: `${frontendUrl}/settings`,
      });

      return { url: session.url };
    } catch (error: any) {
      this.logger.error(`Stripe Portal Session Error: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Could not open billing portal: ${error.message}`);
    }
  }

  async cancelSubscription(userId: string): Promise<{ cancelAt: Date | null }> {
    if (!this.isStripeAvailable()) {
      throw new InternalServerErrorException('Payment system not configured');
    }

    const subscription = await this.getOrCreateSubscription(userId);

    if (!subscription.stripeSubscriptionId) {
      throw new BadRequestException('No active subscription to cancel');
    }

    try {
      const stripeSubscription = await this.stripe!.subscriptions.update(
        subscription.stripeSubscriptionId,
        { cancel_at_period_end: true },
      );

      // openshare-downgrade-lifecycle-v1
      // With cancel_at_period_end Stripe may not provide cancel_at,
      // so current_period_end is the authoritative fallback.
      const cancelAt = stripeSubscription.cancel_at
        ? new Date(stripeSubscription.cancel_at * 1000)
        : stripeSubscription.current_period_end
          ? new Date(
              stripeSubscription.current_period_end * 1000,
            )
          : subscription.currentPeriodEnd || null;

      const downgradeGraceEndsAt = cancelAt
        ? new Date(
            cancelAt.getTime() +
              7 * 24 * 60 * 60 * 1000,
          )
        : undefined;

      await this.subscriptionModel.updateOne(
        { userId: new Types.ObjectId(userId) },
        {
          $set: {
            cancelAt,
            downgradeState: 'scheduled',
            downgradeTargetPlan:
              SubscriptionPlan.FREE,
            ...(cancelAt
              ? { downgradeEffectiveAt: cancelAt }
              : {}),
            ...(downgradeGraceEndsAt
              ? { downgradeGraceEndsAt }
              : {}),
          },
        },
      );

      this.logger.log(`Subscription ${subscription.stripeSubscriptionId} scheduled for cancellation`);

      return { cancelAt };
    } catch (error: any) {
      this.logger.error(`Stripe Cancel Subscription Error: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Could not cancel subscription: ${error.message}`);
    }
  }

  async resumeSubscription(userId: string): Promise<void> {
    if (!this.isStripeAvailable()) {
      throw new InternalServerErrorException('Payment system not configured');
    }

    const subscription = await this.getOrCreateSubscription(userId);

    if (!subscription.stripeSubscriptionId) {
      throw new BadRequestException('No subscription to resume');
    }

    try {
      await this.stripe!.subscriptions.update(
        subscription.stripeSubscriptionId,
        { cancel_at_period_end: false },
      );

      await this.subscriptionModel.updateOne(
        { userId: new Types.ObjectId(userId) },
        {
          // openshare-downgrade-lifecycle-v1
          $set: {
            downgradeState: 'none',

            // openshare-downgrade-member-selection-v1
            downgradeRetainedProjectIds:
              [],
            downgradeRetainedMemberUserIds:
              [],
          },
          $unset: {
            cancelAt: 1,
            downgradeTargetPlan: 1,
            downgradeEffectiveAt: 1,
            downgradeGraceEndsAt: 1,
          },
        },
      );

      this.logger.log(`Subscription ${subscription.stripeSubscriptionId} resumed`);
    } catch (error: any) {
      this.logger.error(`Stripe Resume Subscription Error: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Could not resume subscription: ${error.message}`);
    }
  }

  // account-delete-billing-cleanup-v1
  /**
   * Permanently detach billing before an OpenShare account is deleted.
   *
   * This is intentionally different from cancelSubscription(), which preserves
   * paid access until the end of the current billing period.
   *
   * Account deletion must stop future billing immediately and is fail-closed:
   * if Stripe cleanup fails, the caller must not delete the User document.
   */
  async cleanupBillingForAccountDeletion(userId: string): Promise<void> {
    const subscription = await this.getByUserId(userId);

    // Some older/free accounts may never have created a subscription record.
    if (!subscription) return;

    const stripeCustomerId = String(
      subscription.stripeCustomerId || '',
    ).trim();

    const stripeSubscriptionId = String(
      subscription.stripeSubscriptionId || '',
    ).trim();

    const hasRemoteBillingIdentity =
      Boolean(stripeCustomerId || stripeSubscriptionId);

    if (hasRemoteBillingIdentity && !this.isStripeAvailable()) {
      throw new InternalServerErrorException(
        'Payment system is temporarily unavailable. Account deletion was not completed.',
      );
    }

    if (hasRemoteBillingIdentity) {
      const isResourceMissing = (error: any): boolean =>
        String(error?.code || '') === 'resource_missing';

      const failBillingCleanup = (error: any): never => {
        this.logger.error(
          `Stripe account-deletion cleanup failed: ${error?.message || error}`,
          error?.stack,
        );

        throw new InternalServerErrorException(
          'Could not safely close the billing account. Account deletion was not completed.',
        );
      };

      const cancelKnownSubscription = async (): Promise<void> => {
        if (!stripeSubscriptionId) return;

        try {
          await this.stripe!.subscriptions.cancel(
            stripeSubscriptionId,
            {
              invoice_now: false,
              prorate: false,
            },
          );

          this.logger.log(
            `Canceled Stripe subscription ${stripeSubscriptionId} for account deletion`,
          );
        } catch (error: any) {
          if (!isResourceMissing(error)) {
            failBillingCleanup(error);
          }

          this.logger.warn(
            `Stripe subscription ${stripeSubscriptionId} was already absent during account deletion`,
          );
        }
      };

      if (stripeCustomerId) {
        try {
          // Deleting the Stripe Customer immediately cancels active
          // subscriptions and removes the reusable billing relationship.
          await this.stripe!.customers.del(stripeCustomerId);

          this.logger.log(
            `Deleted Stripe customer ${stripeCustomerId} for account deletion`,
          );
        } catch (error: any) {
          if (!isResourceMissing(error)) {
            failBillingCleanup(error);
          }

          this.logger.warn(
            `Stripe customer ${stripeCustomerId} was already absent during account deletion`,
          );

          // A stale customer ID must not allow a separately known Stripe
          // subscription to survive permanent OpenShare account deletion.
          await cancelKnownSubscription();
        }
      } else {
        // Defensive fallback for a legacy/inconsistent local record that has
        // a subscription ID without its corresponding Stripe Customer ID.
        await cancelKnownSubscription();
      }
    }

    // Account deletion removes OpenShare's local billing/customer linkage.
    // Historical financial records retained by Stripe are not recreated here.
    await this.subscriptionModel.deleteOne({
      userId: new Types.ObjectId(userId),
    });

    this.logger.log(
      `Removed local subscription record for deleted account ${userId}`,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STRIPE WEBHOOKS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Handle webhook request from controller
   */
  async handleWebhookRequest(
    rawBody: Buffer | undefined,
    signature: string,
  ): Promise<{ received: boolean }> {
    if (!this.isStripeAvailable()) {
      this.logger.warn('Webhook received but Stripe not configured');
      return { received: true };
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      this.logger.error('STRIPE_WEBHOOK_SECRET not configured');
      throw new BadRequestException('Webhook not configured');
    }

    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    if (!rawBody) {
      throw new BadRequestException('Missing request body');
    }

    let event: StripeEvent;

    try {
      event = this.stripe!.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (err: any) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    await this.handleWebhook(event);

    return { received: true };
  }

  /**
   * Process Stripe webhook event
   */
  async handleWebhook(event: StripeEvent): Promise<void> {
    this.logger.log(`Processing webhook: ${event.type}`);

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as StripeCheckoutSession;
          await this.handleCheckoutCompleted(session);
          break;
        }

        case 'customer.subscription.created': {
          const subscription = event.data.object as StripeSubscription;
          this.logger.log(`Subscription created: ${subscription.id}`);
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object as StripeSubscription;
          await this.handleSubscriptionUpdated(subscription);
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as StripeSubscription;
          await this.handleSubscriptionDeleted(subscription);
          break;
        }

        case 'invoice.paid': {
          const invoice = event.data.object as StripeInvoice;
          await this.handleInvoicePaid(invoice);
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as StripeInvoice;
          await this.handleInvoicePaymentFailed(invoice);
          break;
        }

        default:
          this.logger.debug(`Unhandled webhook event type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(`Error processing webhook ${event.type}:`, error);
      throw error;
    }
  }

  private async handleCheckoutCompleted(session: StripeCheckoutSession): Promise<void> {
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan as CheckoutPlan;
    const interval = session.metadata?.interval as CheckoutInterval;

    if (!userId || !plan) {
      this.logger.warn('Checkout session missing metadata', session.id);
      return;
    }

    const subscriptionPlan = plan === CheckoutPlan.TEAM
      ? SubscriptionPlan.TEAM
      : SubscriptionPlan.ENTERPRISE;

    const billingInterval = interval === CheckoutInterval.YEARLY
      ? BillingInterval.YEARLY
      : BillingInterval.MONTHLY;

    await this.activateSubscription(
      userId,
      subscriptionPlan,
      billingInterval,
      session.subscription as string,
    );
  }

  private async handleSubscriptionUpdated(stripeSubscription: StripeSubscription): Promise<void> {
    const subscription = await this.getByStripeSubscriptionId(stripeSubscription.id);
    if (!subscription) {
      this.logger.warn(`No subscription found for Stripe ID: ${stripeSubscription.id}`);
      return;
    }

    let status: SubscriptionStatus;
    switch (stripeSubscription.status) {
      case 'active':
        status = SubscriptionStatus.ACTIVE;
        break;
      case 'past_due':
        status = SubscriptionStatus.PAST_DUE;
        break;
      case 'canceled':
        status = SubscriptionStatus.CANCELED;
        break;
      case 'trialing':
        status = SubscriptionStatus.TRIALING;
        break;
      case 'incomplete':
        status = SubscriptionStatus.INCOMPLETE;
        break;
      case 'incomplete_expired':
        status = SubscriptionStatus.INCOMPLETE_EXPIRED;
        break;
      case 'unpaid':
        status = SubscriptionStatus.UNPAID;
        break;
      case 'paused':
        status = SubscriptionStatus.PAUSED;
        break;
      default:
        status = SubscriptionStatus.ACTIVE;
    }

    // openshare-downgrade-lifecycle-v1
    // Keep Stripe payment state separate from OpenShare access state.
    const currentPeriodStart =
      new Date(
        stripeSubscription.current_period_start * 1000,
      );

    const currentPeriodEnd =
      new Date(
        stripeSubscription.current_period_end * 1000,
      );

    const cancelAtPeriodEnd = Boolean(
      (stripeSubscription as any).cancel_at_period_end,
    );

    const cancelAt =
      stripeSubscription.cancel_at
        ? new Date(
            stripeSubscription.cancel_at * 1000,
          )
        : cancelAtPeriodEnd
          ? currentPeriodEnd
          : null;

    const updateSet: Record<string, any> = {
      status,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAt,
    };

    const updateUnset: Record<string, number> = {};

    if (
      cancelAtPeriodEnd &&
      subscription.plan !== SubscriptionPlan.FREE
    ) {
      const effectiveAt =
        cancelAt || currentPeriodEnd;

      updateSet.downgradeState = 'scheduled';
      updateSet.downgradeTargetPlan =
        SubscriptionPlan.FREE;
      updateSet.downgradeEffectiveAt =
        effectiveAt;
      updateSet.downgradeGraceEndsAt =
        new Date(
          effectiveAt.getTime() +
            7 * 24 * 60 * 60 * 1000,
        );
    } else {
      updateSet.downgradeState = 'none';

      // openshare-downgrade-member-selection-v1
      // A non-canceling paid subscription starts a fresh downgrade cycle.
      updateSet.downgradeRetainedProjectIds =
        [];
      updateSet.downgradeRetainedMemberUserIds =
        [];

      updateUnset.downgradeTargetPlan = 1;
      updateUnset.downgradeEffectiveAt = 1;
      updateUnset.downgradeGraceEndsAt = 1;
    }

    await this.subscriptionModel.updateOne(
      { _id: subscription._id },
      {
        $set: updateSet,
        ...(Object.keys(updateUnset).length > 0
          ? { $unset: updateUnset }
          : {}),
      },
    );
  }

  private async handleSubscriptionDeleted(stripeSubscription: StripeSubscription): Promise<void> {
    const subscription = await this.getByStripeSubscriptionId(stripeSubscription.id);
    if (!subscription) {
      this.logger.warn(`No subscription found for Stripe ID: ${stripeSubscription.id}`);
      return;
    }

    const freeLimits =
      PLAN_CONFIGS[SubscriptionPlan.FREE].limits;

    // openshare-downgrade-lifecycle-v1
    // Paid access ended, but the OpenShare account remains active on Free.
    // No customer data is deleted here.
    const now = new Date();

    const downgradeEffectiveAt =
      stripeSubscription.current_period_end
        ? new Date(
            stripeSubscription.current_period_end * 1000,
          )
        : subscription.cancelAt ||
          subscription.currentPeriodEnd ||
          now;

    const downgradeGraceEndsAt =
      new Date(
        downgradeEffectiveAt.getTime() +
          7 * 24 * 60 * 60 * 1000,
      );

    await this.subscriptionModel.updateOne(
      { _id: subscription._id },
      {
        $set: {
          plan: SubscriptionPlan.FREE,
          status: SubscriptionStatus.ACTIVE,
          limits: freeLimits,
          canceledAt: now,
          downgradeState: 'grace',
          downgradeTargetPlan:
            SubscriptionPlan.FREE,
          downgradeEffectiveAt,
          downgradeGraceEndsAt,
        },
        $unset: {
          stripeSubscriptionId: 1,
          stripePriceId: 1,
          currentPeriodStart: 1,
          currentPeriodEnd: 1,
          cancelAt: 1,
        },
      },
    );

    this.eventEmitter.emit('subscription.canceled', {
      userId: subscription.userId.toString(),
      previousPlan: subscription.plan,
    });

    this.logger.log(
      `Subscription ${stripeSubscription.id} ended; account moved to Free downgrade grace period`,
    );
  }

  private async handleInvoicePaid(invoice: StripeInvoice): Promise<void> {
    if (!invoice.subscription) return;

    const subscription = await this.getByStripeSubscriptionId(invoice.subscription);
    if (!subscription) return;

    await this.subscriptionModel.updateOne(
      { _id: subscription._id },
      { status: SubscriptionStatus.ACTIVE },
    );

    this.logger.log(`Invoice paid for subscription ${invoice.subscription}`);
  }

  private async handleInvoicePaymentFailed(invoice: StripeInvoice): Promise<void> {
    if (!invoice.subscription) return;

    const subscription = await this.getByStripeSubscriptionId(invoice.subscription);
    if (!subscription) return;

    await this.subscriptionModel.updateOne(
      { _id: subscription._id },
      { status: SubscriptionStatus.PAST_DUE },
    );

    this.eventEmitter.emit('subscription.payment_failed', {
      userId: subscription.userId.toString(),
      plan: subscription.plan,
    });

    this.logger.warn(`Payment failed for subscription ${invoice.subscription}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BUDGET CAP
  // ═══════════════════════════════════════════════════════════════════════════

  async updateBudgetCap(userId: string, dto: UpdateBudgetCapDto): Promise<void> {
    const update: any = {};

    if (dto.budgetCapCents !== undefined) {
      update.budgetCapCents = dto.budgetCapCents;
    }

    if (dto.budgetCapEnabled !== undefined) {
      update.budgetCapEnabled = dto.budgetCapEnabled;
    }

    await this.subscriptionModel.updateOne(
      { userId: new Types.ObjectId(userId) },
      { $set: update },
    );
  }

  async updateBillingDetails(userId: string, dto: UpdateBillingDetailsDto): Promise<void> {
    const update: any = {};

    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined) {
        update[`billingDetails.${key}`] = value;
      }
    }

    await this.subscriptionModel.updateOne(
      { userId: new Types.ObjectId(userId) },
      { $set: update },
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PLAN INFO
  // ═══════════════════════════════════════════════════════════════════════════

  getPlanConfig(plan: SubscriptionPlan): PlanConfig {
    return PLAN_CONFIGS[plan];
  }

  getAllPlanConfigs(): Record<SubscriptionPlan, PlanConfig> {
    return PLAN_CONFIGS;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  private getPriceId(plan: CheckoutPlan, interval: CheckoutInterval): string | null {
    const priceIds: Record<string, string | undefined> = {
      'team_monthly': process.env.STRIPE_TEAM_MONTHLY_PRICE_ID,
      'team_yearly': process.env.STRIPE_TEAM_YEARLY_PRICE_ID,
      'enterprise_monthly': process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID,
      'enterprise_yearly': process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID,
    };

    const key = `${plan}_${interval}`;
    return priceIds[key] || null;
  }

  private async activateSubscription(
    userId: string,
    plan: SubscriptionPlan,
    billingInterval: BillingInterval,
    stripeSubscriptionId: string,
  ): Promise<void> {
    const limits = PLAN_CONFIGS[plan].limits;

    await this.subscriptionModel.updateOne(
      { userId: new Types.ObjectId(userId) },
      {
        // openshare-downgrade-lifecycle-v1
        $set: {
          plan,
          billingInterval,
          status: SubscriptionStatus.ACTIVE,
          stripeSubscriptionId,
          limits,
          downgradeState: 'none',

          // openshare-downgrade-member-selection-v1
          downgradeRetainedProjectIds:
            [],
          downgradeRetainedMemberUserIds:
            [],
        },
        $unset: {
          canceledAt: 1,
          cancelAt: 1,
          downgradeTargetPlan: 1,
          downgradeEffectiveAt: 1,
          downgradeGraceEndsAt: 1,
        },
      },
    );

    this.eventEmitter.emit('subscription.activated', {
      userId,
      plan,
      billingInterval,
    });

    this.logger.log(`Activated ${plan} subscription for user ${userId}`);
  }
}
