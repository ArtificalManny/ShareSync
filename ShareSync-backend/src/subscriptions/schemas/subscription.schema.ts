// src/subscriptions/schemas/subscription.schema.ts
// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION SCHEMA - MongoDB schema for user/org subscriptions
// Phase 5: Stripe-powered subscription system
// ═══════════════════════════════════════════════════════════════════════════════

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// ═══════════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════════

export enum SubscriptionPlan {
  FREE = 'free',
  TEAM = 'team',
  ENTERPRISE = 'enterprise',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  PAST_DUE = 'past_due',
  TRIALING = 'trialing',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
  UNPAID = 'unpaid',
  PAUSED = 'paused',
}

export enum BillingInterval {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

// openshare-downgrade-lifecycle-v1
// Payment status and OpenShare access-transition state are separate.
export enum DowngradeState {
  NONE = 'none',
  SCHEDULED = 'scheduled',
  GRACE = 'grace',
  RESTRICTED = 'restricted',
}

// ═══════════════════════════════════════════════════════════════════════════════
// NESTED SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

@Schema({ _id: false })
export class SubscriptionUsage {
  @Prop({ type: Number, default: 0 })
  projects: number;

  @Prop({ type: Number, default: 0 })
  storage: number; // bytes

  @Prop({ type: Number, default: 0 })
  aiCalls: number;

  @Prop({ type: Number, default: 0 })
  aiCallsThisMonth: number;

  @Prop({ type: Date })
  aiCallsResetAt?: Date;
}

export const SubscriptionUsageSchema = SchemaFactory.createForClass(SubscriptionUsage);

@Schema({ _id: false })
export class SubscriptionLimits {
  @Prop({ type: Number, default: 10 })
  projects: number; // -1 = unlimited

  @Prop({ type: Number, default: 10 })
  membersPerProject: number; // -1 = unlimited

  @Prop({ type: Number, default: 1073741824 }) // 1GB default
  storageBytes: number; // -1 = unlimited

  @Prop({ type: Number, default: 100 })
  aiCallsPerMonth: number; // -1 = unlimited

  @Prop({ type: Number, default: 3 })
  maxWorkspaces: number; // -1 = unlimited
}

export const SubscriptionLimitsSchema = SchemaFactory.createForClass(SubscriptionLimits);

@Schema({ _id: false })
export class BillingDetails {
  @Prop({ type: String })
  name?: string;

  @Prop({ type: String })
  email?: string;

  @Prop({ type: String })
  company?: string;

  @Prop({ type: String })
  address?: string;

  @Prop({ type: String })
  city?: string;

  @Prop({ type: String })
  state?: string;

  @Prop({ type: String })
  postalCode?: string;

  @Prop({ type: String })
  country?: string;

  @Prop({ type: String })
  taxId?: string;
}

export const BillingDetailsSchema = SchemaFactory.createForClass(BillingDetails);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SUBSCRIPTION SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════

export type SubscriptionDocument = Subscription & Document;

@Schema({
  timestamps: true,
  collection: 'subscriptions',
})
export class Subscription {
  // ─────────────────────────────────────────────────────────────────────────────
  // OWNERSHIP
  // ─────────────────────────────────────────────────────────────────────────────

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Organization', index: true })
  organizationId?: Types.ObjectId;

  // ─────────────────────────────────────────────────────────────────────────────
  // PLAN & STATUS
  // ─────────────────────────────────────────────────────────────────────────────

  @Prop({ type: String, enum: SubscriptionPlan, default: SubscriptionPlan.FREE })
  plan: SubscriptionPlan;

  @Prop({ type: String, enum: SubscriptionStatus, default: SubscriptionStatus.ACTIVE })
  status: SubscriptionStatus;

  @Prop({ type: String, enum: BillingInterval, default: BillingInterval.MONTHLY })
  billingInterval: BillingInterval;

  // ─────────────────────────────────────────────────────────────────────────────
  // STRIPE INTEGRATION
  // ─────────────────────────────────────────────────────────────────────────────

  @Prop({ type: String, index: true })
  stripeCustomerId?: string;

  @Prop({ type: String, index: true })
  stripeSubscriptionId?: string;

  @Prop({ type: String })
  stripePriceId?: string;

  @Prop({ type: String })
  stripePaymentMethodId?: string;

  // openshare-apple-subscription-verification-v1
  // Billing-provider identity is explicit so Stripe and Apple lifecycles
  // cannot accidentally share provider-specific identifiers.
  @Prop({
    type: String,
    enum: ['stripe', 'apple'],
  })
  billingProvider?: 'stripe' | 'apple';

  @Prop({ type: String })
  appleProductId?: string;

  @Prop({ type: String })
  appleOriginalTransactionId?: string;

  @Prop({ type: String })
  appleLatestTransactionId?: string;

  @Prop({ type: String })
  appleAppAccountToken?: string;

  @Prop({ type: String })
  appleEnvironment?: string;

  // openshare-apple-server-notifications-v2
  //
  // App Store Server Notifications may be delivered more than once and may
  // arrive out of order. The last cursor is diagnostic/order metadata, while
  // the bounded UUID window prevents normal Apple retry delivery from applying
  // the same lifecycle mutation twice.
  @Prop({ type: String })
  appleLastNotificationUUID?: string;

  @Prop({ type: Number })
  appleLastNotificationSignedDate?: number;

  @Prop({
    type: [String],
    default: [],
  })
  appleProcessedNotificationUUIDs: string[];

  // ─────────────────────────────────────────────────────────────────────────────
  // BILLING PERIOD
  // ─────────────────────────────────────────────────────────────────────────────

  @Prop({ type: Date })
  currentPeriodStart?: Date;

  @Prop({ type: Date })
  currentPeriodEnd?: Date;

  @Prop({ type: Date })
  canceledAt?: Date;

  @Prop({ type: Date })
  cancelAt?: Date; // Scheduled cancellation

  // openshare-downgrade-lifecycle-v1
  // Billing transitions may change access, but never authorize deletion
  // of projects, files, messages, memberships, or other customer data.
  @Prop({
    type: String,
    enum: DowngradeState,
    default: DowngradeState.NONE,
  })
  downgradeState: DowngradeState;

  @Prop({ type: String, enum: SubscriptionPlan })
  downgradeTargetPlan?: SubscriptionPlan;

  @Prop({ type: Date })
  downgradeEffectiveAt?: Date;

  @Prop({ type: Date })
  downgradeGraceEndsAt?: Date;

  // openshare-project-write-entitlement-v1
  // Projects explicitly retained as writable when a downgraded account is
  // above its Free project allowance. Billing state never archives or deletes
  // the underlying Project documents.
  @Prop({ type: [String], default: [] })
  downgradeRetainedProjectIds: string[];

  // openshare-downgrade-member-selection-v1
  //
  // Accepted workspace users explicitly retained as active after the
  // downgrade grace period when the workspace exceeds the Free member limit.
  //
  // Billing never deletes or rewrites Project.members. This is a
  // subscription-side access overlay only.
  @Prop({ type: [String], default: [] })
  downgradeRetainedMemberUserIds: string[];

  // openshare-downgrade-lifecycle-notifications-v1
  //
  // Each value stores the downgrade-cycle key for which that lifecycle
  // notification has already been claimed. Using the cycle key instead of
  // a Boolean lets later cancel/resume cycles notify normally without
  // deleting historical customer data.
  @Prop({ type: String })
  downgradeScheduledNotificationKey?: string;

  @Prop({ type: String })
  downgradeGraceStartedNotificationKey?: string;

  @Prop({ type: String })
  downgradeGraceEndingNotificationKey?: string;

  @Prop({ type: String })
  downgradeRestrictedNotificationKey?: string;

  @Prop({ type: String })
  downgradeRestoredNotificationKey?: string;

  @Prop({ type: Date })
  trialStart?: Date;

  @Prop({ type: Date })
  trialEnd?: Date;

  // ─────────────────────────────────────────────────────────────────────────────
  // USAGE & LIMITS
  // ─────────────────────────────────────────────────────────────────────────────

  @Prop({ type: Number, default: 1 })
  activeMembers: number;

  @Prop({ type: SubscriptionUsageSchema, default: () => ({}) })
  usage: SubscriptionUsage;

  @Prop({ type: SubscriptionLimitsSchema, default: () => ({}) })
  limits: SubscriptionLimits;

  // ─────────────────────────────────────────────────────────────────────────────
  // BUDGET CONTROL (Fair Pricing Promise)
  // ─────────────────────────────────────────────────────────────────────────────

  @Prop({ type: Number })
  budgetCapCents?: number; // User-defined max budget in cents

  @Prop({ type: Boolean, default: false })
  budgetCapEnabled: boolean;

  // ─────────────────────────────────────────────────────────────────────────────
  // BILLING DETAILS
  // ─────────────────────────────────────────────────────────────────────────────

  @Prop({ type: BillingDetailsSchema, default: () => ({}) })
  billingDetails: BillingDetails;

  // ─────────────────────────────────────────────────────────────────────────────
  // METADATA
  // ─────────────────────────────────────────────────────────────────────────────

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  // Timestamps (auto-managed)
  createdAt: Date;
  updatedAt: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

// ═══════════════════════════════════════════════════════════════════════════════
// INDEXES
// ═══════════════════════════════════════════════════════════════════════════════

SubscriptionSchema.index({ userId: 1 }, { unique: true });
SubscriptionSchema.index({ stripeCustomerId: 1 }, { sparse: true });
SubscriptionSchema.index({ stripeSubscriptionId: 1 }, { sparse: true });

// openshare-apple-subscription-verification-v1
// One App Store subscription lineage may belong to only one OpenShare
// subscription record.
SubscriptionSchema.index(
  { appleOriginalTransactionId: 1 },
  { unique: true, sparse: true },
);

SubscriptionSchema.index({ plan: 1, status: 1 });
