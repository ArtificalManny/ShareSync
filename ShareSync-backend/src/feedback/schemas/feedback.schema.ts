import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';
import {
  HydratedDocument,
} from 'mongoose';

// pilot-feedback-backend-v1

export type FeedbackDocument =
  HydratedDocument<Feedback>;

export type FeedbackType =
  | 'feedback'
  | 'bug'
  | 'idea';

@Schema({
  timestamps: true,
})
export class Feedback {
  @Prop({
    required: true,
    trim: true,
    index: true,
  })
  userId: string;

  @Prop({
    required: true,
    enum: [
      'feedback',
      'bug',
      'idea',
    ],
    default: 'feedback',
  })
  type: FeedbackType;

  @Prop({
    required: true,
    trim: true,
    maxlength: 4000,
  })
  content: string;

  // Deliberately pathname-only.
  // Do not persist query-string values because invite/reset
  // URLs may contain sensitive tokens.
  @Prop({
    trim: true,
    maxlength: 1000,
  })
  route?: string;

  @Prop({
    trim: true,
    maxlength: 100,
  })
  appVersion?: string;

  @Prop({
    trim: true,
    maxlength: 100,
  })
  buildId?: string;

  @Prop({
    trim: true,
    maxlength: 200,
  })
  platform?: string;

  @Prop({
    trim: true,
    maxlength: 1000,
  })
  userAgent?: string;

  @Prop()
  viewportWidth?: number;

  @Prop()
  viewportHeight?: number;

  @Prop()
  online?: boolean;

  @Prop()
  clientTimestamp?: Date;

  @Prop({
    type: [String],
    default: [],
  })
  recentErrors?: string[];

  createdAt?: Date;
  updatedAt?: Date;
}

export const FeedbackSchema =
  SchemaFactory.createForClass(Feedback);

FeedbackSchema.index({
  createdAt: -1,
});

FeedbackSchema.index({
  userId: 1,
  createdAt: -1,
});
