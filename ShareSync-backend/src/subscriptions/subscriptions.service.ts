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
  };
  checkout: {
    sessions: {
      create: (params: any) => Promise<StripeCheckoutSession>;
    };
  };
  subscriptions: {
    update: (id: string, params: any) => Promise<StripeSubscription>;
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
      membersPerProject: 5,
      storageBytes: 1 * 1024 * 1024 * 1024,
      aiCallsPerMonth: 100,
      maxWorkspaces: 3,
    },
    features: [
      'Up to 10 projects',
      '5 members per project',
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
      '25 members per project',
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
        current = subscription.usage.projects || 0;
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
    const updateField = resource === 'aiCalls' ? 'usage.aiCallsThisMonth' : `usage.${resource}`;

    await this.subscriptionModel.updateOne(
      { userId: new Types.ObjectId(userId) },
      {
        $inc: { [updateField]: amount },
        ...(resource === 'aiCalls' && { $inc: { 'usage.aiCalls': amount } }),
      },
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

    const priceId = this.getPriceId(dto.plan, dto.interval || CheckoutInterval.MONTHLY);
    if (!priceId) {
      throw new BadRequestException(`No price configured for plan: ${dto.plan}`);
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const successUrl = dto.successUrl || `${frontendUrl}/settings?subscription=success`;
    const cancelUrl = dto.cancelUrl || `${frontendUrl}/settings?subscription=canceled`;

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
      tax_id_collection: {
        enabled: true,
      },
    });

    this.logger.log(`Created checkout session ${session.id} for user ${userId}`);

    return {
      url: session.url!,
      sessionId: session.id,
    };
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

    const session = await this.stripe!.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${frontendUrl}/settings`,
    });

    return { url: session.url };
  }

  async cancelSubscription(userId: string): Promise<{ cancelAt: Date | null }> {
    if (!this.isStripeAvailable()) {
      throw new InternalServerErrorException('Payment system not configured');
    }

    const subscription = await this.getOrCreateSubscription(userId);

    if (!subscription.stripeSubscriptionId) {
      throw new BadRequestException('No active subscription to cancel');
    }

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
  }

  async resumeSubscription(userId: string): Promise<void> {
    if (!this.isStripeAvailable()) {
      throw new InternalServerErrorException('Payment system not configured');
    }

    const subscription = await this.getOrCreateSubscription(userId);

    if (!subscription.stripeSubscriptionId) {
      throw new BadRequestException('No subscription to resume');
    }

    await this.stripe!.subscriptions.update(
      subscription.stripeSubscriptionId,
      { cancel_at_period_end: false },
    );

    await this.subscriptionModel.updateOne(
      { userId: new Types.ObjectId(userId) },
      { $unset: { cancelAt: 1 } },
    );

    this.logger.log(`Subscription ${subscription.stripeSubscriptionId} resumed`);
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
