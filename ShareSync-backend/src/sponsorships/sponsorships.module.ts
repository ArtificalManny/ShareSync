import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

import {
  SponsorshipCampaign,
  SponsorshipCampaignSchema,
} from './schemas/sponsorship-campaign.schema';

import {
  SponsorshipEvent,
  SponsorshipEventSchema,
} from './schemas/sponsorship-event.schema';

import { SponsorshipsController } from './sponsorships.controller';
import { SponsorshipsService } from './sponsorships.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: SponsorshipCampaign.name,
        schema: SponsorshipCampaignSchema,
      },
      {
        name: SponsorshipEvent.name,
        schema: SponsorshipEventSchema,
      },
    ]),
    SubscriptionsModule,
  ],
  controllers: [SponsorshipsController],
  providers: [SponsorshipsService],
})
export class SponsorshipsModule {}
