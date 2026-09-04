import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SponsorshipEventDocument =
  HydratedDocument<SponsorshipEvent>;

@Schema({
  collection: 'sponsorship_events',
  versionKey: false,
})
export class SponsorshipEvent {
  @Prop({
    required: true,
    index: true,
  })
  campaignId!: string;

  @Prop({
    required: true,
    index: true,
  })
  placement!: string;

  @Prop({
    required: true,
    enum: ['impression', 'click'],
    index: true,
  })
  eventType!: 'impression' | 'click';

  @Prop({
    type: Date,
    default: Date.now,
    index: true,
  })
  timestamp!: Date;
}

export const SponsorshipEventSchema =
  SchemaFactory.createForClass(SponsorshipEvent);

// Intentionally contains no user ID, IP address, device fingerprint,
// behavioral profile, or interest-category data.
SponsorshipEventSchema.index({
  campaignId: 1,
  eventType: 1,
  timestamp: -1,
});
