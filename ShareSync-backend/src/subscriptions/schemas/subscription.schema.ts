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

  @Prop({ type: Number, default: 5 })
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
SubscriptionSchema.index({ plan: 1, status: 1 });
