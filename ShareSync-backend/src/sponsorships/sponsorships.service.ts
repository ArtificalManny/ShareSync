import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { SubscriptionsService } from '../subscriptions/subscriptions.service';

import {
  SponsorshipCampaign,
  SponsorshipCampaignDocument,
  SPONSORSHIP_PLACEMENTS,
} from './schemas/sponsorship-campaign.schema';

import {
  SponsorshipEvent,
  SponsorshipEventDocument,
} from './schemas/sponsorship-event.schema';

@Injectable()
export class SponsorshipsService {
  constructor(
    @InjectModel(SponsorshipCampaign.name)
    private readonly campaignModel: Model<SponsorshipCampaignDocument>,

    @InjectModel(SponsorshipEvent.name)
    private readonly eventModel: Model<SponsorshipEventDocument>,

    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  private normalizePlacement(value?: string) {
    const placement = String(
      value || 'discover_sidebar',
    ).trim();

    if (
      !SPONSORSHIP_PLACEMENTS.includes(
        placement as any,
      )
    ) {
      throw new BadRequestException(
        'Unsupported sponsorship placement',
      );
    }

    return placement;
  }

  private async isAdFreeUser(userId: string) {
    const subscription =
      await this.subscriptionsService.getOrCreateSubscription(
        userId,
      );

    const plan = String(
      subscription?.plan || 'free',
    ).toLowerCase();

    const status = String(
      subscription?.status || 'active',
    ).toLowerCase();

    // Any active non-free tier receives an ad-free experience.
    // This automatically covers Team, Enterprise, and legacy paid
    // tiers without having to hard-code each product name.
    return (
      plan !== 'free' &&
      ['active', 'trialing'].includes(status)
    );
  }

  private toPublicCampaign(campaign: any) {
    if (!campaign) return null;

    return {
      id: campaign.campaignId,
      campaignId: campaign.campaignId,
      placement: campaign.placement,
      type: campaign.type,
      sponsorName: campaign.sponsorName,
      sponsorLogo: campaign.sponsorLogo || '',
      eyebrow:
        campaign.eyebrow || 'Partner Spotlight',
      title: campaign.title,
      description: campaign.description,
      ctaLabel:
        campaign.ctaLabel || 'Explore resource',
      destinationUrl: campaign.destinationUrl,
      startsAt: campaign.startsAt,
      endsAt: campaign.endsAt,
    };
  }

  async getActiveCampaign(
    userId: string,
    placementValue?: string,
  ) {
    const placement =
      this.normalizePlacement(placementValue);

    const adFree = await this.isAdFreeUser(userId);

    if (adFree) {
      return {
        success: true,
        data: null,
        adFree: true,
      };
    }

    const now = new Date();

    const campaign = await this.campaignModel
      .findOne({
        status: 'active',
        placement,
        startsAt: { $lte: now },
        endsAt: { $gte: now },
      })
      .sort({
        priority: -1,
        startsAt: -1,
      })
      .lean();

    return {
      success: true,
      data: this.toPublicCampaign(campaign),
      adFree: false,
    };
  }

  async recordEvent(
    userId: string,
    campaignIdValue: string,
    eventType: 'impression' | 'click',
    placementValue?: string,
  ) {
    const campaignId = String(
      campaignIdValue || '',
    ).trim();

    if (!campaignId) {
      throw new BadRequestException(
        'campaignId is required',
      );
    }

    const placement =
      this.normalizePlacement(placementValue);

    // Paid users should never generate sponsorship analytics.
    const adFree = await this.isAdFreeUser(userId);

    if (adFree) {
      return {
        success: true,
        recorded: false,
      };
    }

    const now = new Date();

    const campaign = await this.campaignModel
      .findOne({
        campaignId,
        status: 'active',
        placement,
        startsAt: { $lte: now },
        endsAt: { $gte: now },
      })
      .select('_id campaignId placement')
      .lean();

    // Stale cards or expired campaigns simply stop recording.
    if (!campaign) {
      return {
        success: true,
        recorded: false,
      };
    }

    const counterField =
      eventType === 'click'
        ? 'clicks'
        : 'impressions';

    await Promise.all([
      this.eventModel.create({
        campaignId,
        placement,
        eventType,
        timestamp: now,
      }),

      this.campaignModel.updateOne(
        { _id: campaign._id },
        {
          $inc: {
            [counterField]: 1,
          },
        },
      ),
    ]);

    return {
      success: true,
      recorded: true,
    };
  }
}
