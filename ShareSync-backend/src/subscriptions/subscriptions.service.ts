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
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  Subscription,
  SubscriptionDocument,
  SubscriptionPlan,
  SubscriptionStatus,
  BillingInterval,
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

  async countOwnedProjectsForUser(
    userId: string,
  ): Promise<number> {
    return this.projectModel
      .countDocuments(
        this.getOwnedProjectUsageQuery(userId),
      )
      .exec();
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

  async checkWorkspaceMemberLimit(
    ownerUserId: string,
    candidate?: { userId?: string; email?: string },
  ): Promise<{ allowed: boolean; current: number; limit: number; remaining: number }> {
    const subscription = await this.getOrCreateSubscription(ownerUserId);
    const storedLimit = subscription.limits?.membersPerProject;
      const limit =
        String(subscription.plan).toLowerCase() === 'free'
          ? PLAN_CONFIGS[SubscriptionPlan.FREE].limits.membersPerProject
          : typeof storedLimit === 'number'
            ? storedLimit
            : PLAN_CONFIGS[SubscriptionPlan.TEAM].limits.membersPerProject;

    if (limit === -1) {
      return { allowed: true, current: 0, limit, remaining: Infinity };
    }

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

    const current = identities.size;

    if (candidate?.userId) {
      identities.add(`user:${candidate.userId}`);
    } else if (candidate?.email) {
      identities.add(`email:${String(candidate.email).trim().toLowerCase()}`);
    }

    const projected = identities.size;
    const allowed = projected <= limit;
    const remaining = Math.max(0, limit - current);

    return { allowed, current, limit, remaining };
  }

  async checkLimit(
    userId: string,
    resource: 'projects' | 'storage' | 'aiCalls',
    amount = 1,
  ): Promise<{ allowed: boolean; current: number; limit: number; remaining: number }> {
    const subscription = await this.getOrCreateSubscription(userId);

    let limit: number;
    let current: number;

    switch (resource) {
      case 'projects':
        limit = subscription.limits.projects;
        current = await this.countOwnedProjectsForUser(userId);
        break;
      case 'storage':
        limit = subscription.limits.storageBytes;
        current = subscription.usage.storage || 0;
        break;
      case 'aiCalls':
        limit = subscription.limits.aiCallsPerMonth;
        current = subscription.usage.aiCallsThisMonth || 0;
        break;
      default:
        throw new BadRequestException(`Unknown resource: ${resource}`);
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
    await this.getOrCreateSubscription(userId);

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

    let customerId = subscription.stripeCustomerId;
    
    try {
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
      }
    } catch (error: any) {
      this.logger.error(`Stripe Customer Creation Error: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Could not create billing account: ${error.message}`);
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

      const cancelAt = stripeSubscription.cancel_at
        ? new Date(stripeSubscription.cancel_at * 1000)
        : null;

      await this.subscriptionModel.updateOne(
        { userId: new Types.ObjectId(userId) },
        { cancelAt },
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
        { $unset: { cancelAt: 1 } },
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

    await this.subscriptionModel.updateOne(
      { _id: subscription._id },
      {
        status,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAt: stripeSubscription.cancel_at
          ? new Date(stripeSubscription.cancel_at * 1000)
          : null,
      },
    );
  }

  private async handleSubscriptionDeleted(stripeSubscription: StripeSubscription): Promise<void> {
    const subscription = await this.getByStripeSubscriptionId(stripeSubscription.id);
    if (!subscription) {
      this.logger.warn(`No subscription found for Stripe ID: ${stripeSubscription.id}`);
      return;
    }

    const freeLimits = PLAN_CONFIGS[SubscriptionPlan.FREE].limits;

    await this.subscriptionModel.updateOne(
      { _id: subscription._id },
      {
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.CANCELED,
        limits: freeLimits,
        canceledAt: new Date(),
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

    this.logger.log(`Subscription ${stripeSubscription.id} canceled and downgraded to free`);
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
        plan,
        billingInterval,
        status: SubscriptionStatus.ACTIVE,
        stripeSubscriptionId,
        limits,
        $unset: { canceledAt: 1, cancelAt: 1 },
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
