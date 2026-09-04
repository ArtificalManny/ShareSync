import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export const SPONSORSHIP_PLACEMENTS = [
  'discover_sidebar',
  'discover_feed',
  'digest_email',
] as const;

export const SPONSORSHIP_TYPES = [
  'resource',
  'template',
  'challenge',
  'event',
  'community',
  'partner',
] as const;

export const SPONSORSHIP_STATUSES = [
  'draft',
  'active',
  'paused',
  'ended',
] as const;

export type SponsorshipPlacement =
  (typeof SPONSORSHIP_PLACEMENTS)[number];

export type SponsorshipType =
  (typeof SPONSORSHIP_TYPES)[number];

export type SponsorshipCampaignDocument =
  HydratedDocument<SponsorshipCampaign>;

@Schema({
  collection: 'sponsorship_campaigns',
  timestamps: true,
})
export class SponsorshipCampaign {
  @Prop({
    required: true,
    unique: true,
    index: true,
    trim: true,
  })
  campaignId!: string;

  @Prop({
    required: true,
    enum: SPONSORSHIP_STATUSES,
    default: 'draft',
    index: true,
  })
  status!: string;

  @Prop({
    required: true,
    enum: SPONSORSHIP_PLACEMENTS,
    index: true,
  })
  placement!: string;

  @Prop({
    required: true,
    enum: SPONSORSHIP_TYPES,
    default: 'partner',
  })
  type!: string;

  @Prop({
    required: true,
    trim: true,
    maxlength: 100,
  })
  sponsorName!: string;

  // IMPORTANT:
  // Prefer first-party OpenShare-hosted assets here.
  // Do not use sponsor-hosted tracking pixels.
  @Prop({
    default: '',
    trim: true,
    maxlength: 500,
  })
  sponsorLogo!: string;

  @Prop({
    default: 'Partner Spotlight',
    trim: true,
    maxlength: 80,
  })
  eyebrow!: string;

  @Prop({
    required: true,
    trim: true,
    maxlength: 140,
  })
  title!: string;

  @Prop({
    required: true,
    trim: true,
    maxlength: 240,
  })
  description!: string;

  @Prop({
    required: true,
    default: 'Explore resource',
    trim: true,
    maxlength: 60,
  })
  ctaLabel!: string;

  @Prop({
    required: true,
    trim: true,
    maxlength: 1000,
  })
  destinationUrl!: string;

  @Prop({
    required: true,
    type: Date,
    index: true,
  })
  startsAt!: Date;

  @Prop({
    required: true,
    type: Date,
    index: true,
  })
  endsAt!: Date;

  @Prop({
    type: Number,
    default: 0,
  })
  priority!: number;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  impressions!: number;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  clicks!: number;
}

export const SponsorshipCampaignSchema =
  SchemaFactory.createForClass(SponsorshipCampaign);

SponsorshipCampaignSchema.index({
  status: 1,
  placement: 1,
  startsAt: 1,
  endsAt: 1,
  priority: -1,
});
