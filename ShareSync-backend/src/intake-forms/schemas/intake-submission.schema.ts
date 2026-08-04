import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';
import {
  HydratedDocument,
  Schema as MongooseSchema,
  Types,
} from 'mongoose';

import {
  IntakeFieldType,
} from './intake-form.schema';

export enum IntakeSubmissionStatus {
  NEW = 'new',
  REVIEWING = 'reviewing',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export enum IntakeConversionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  CONVERTED = 'converted',
  FAILED = 'failed',
}

@Schema({
  _id: false,
})
export class IntakeSubmissionAnswer {
  @Prop({
    required: true,
    maxlength: 64,
  })
  fieldId: string;

  @Prop({
    required: true,
    maxlength: 200,
  })
  label: string;

  @Prop({
    required: true,
    enum: IntakeFieldType,
  })
  type: IntakeFieldType;

  @Prop({
    type: MongooseSchema.Types.Mixed,
    required: true,
  })
  value: unknown;
}

export const IntakeSubmissionAnswerSchema =
  SchemaFactory.createForClass(
    IntakeSubmissionAnswer,
  );

@Schema({
  _id: false,
})
export class IntakeSubmissionSource {
  @Prop({
    default: '',
    maxlength: 500,
  })
  userAgent: string;

  @Prop({
    default: '',
    maxlength: 1000,
  })
  referer: string;
}

export const IntakeSubmissionSourceSchema =
  SchemaFactory.createForClass(
    IntakeSubmissionSource,
  );

@Schema({
  timestamps: true,
  collection: 'intake_submissions',
})
export class IntakeSubmission {
  @Prop({
    type: Types.ObjectId,
    ref: 'IntakeForm',
    required: true,
    index: true,
  })
  formId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true,
  })
  projectId: Types.ObjectId;

  @Prop({
    type: [IntakeSubmissionAnswerSchema],
    default: [],
  })
  answers: IntakeSubmissionAnswer[];

  @Prop({
    enum: IntakeSubmissionStatus,
    default: IntakeSubmissionStatus.NEW,
    index: true,
  })
  status: IntakeSubmissionStatus;

  @Prop({
    type: IntakeSubmissionSourceSchema,
    default: {},
  })
  source: IntakeSubmissionSource;

  @Prop({
    type: Date,
    default: Date.now,
    index: true,
  })
  submittedAt: Date;

  @Prop({
    type: Types.ObjectId,
    ref: 'Task',
    default: null,
  })
  convertedTaskId?: Types.ObjectId | null;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    default: null,
  })
  convertedBy?: Types.ObjectId | null;

  @Prop({
    type: Date,
    default: null,
  })
  convertedAt?: Date | null;

  @Prop({
    enum: IntakeConversionStatus,
    default: IntakeConversionStatus.PENDING,
  })
  conversionStatus: IntakeConversionStatus;

  @Prop({
    default: '',
    maxlength: 500,
  })
  conversionError: string;

  createdAt: Date;
  updatedAt: Date;
}

export type IntakeSubmissionDocument =
  HydratedDocument<IntakeSubmission>;

export const IntakeSubmissionSchema =
  SchemaFactory.createForClass(
    IntakeSubmission,
  );

IntakeSubmissionSchema.index({
  formId: 1,
  submittedAt: -1,
});

IntakeSubmissionSchema.index({
  projectId: 1,
  status: 1,
  submittedAt: -1,
});
