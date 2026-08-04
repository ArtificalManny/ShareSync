import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';
import {
  HydratedDocument,
  Types,
} from 'mongoose';

export enum IntakeFieldType {
  SHORT_TEXT = 'short_text',
  LONG_TEXT = 'long_text',
  EMAIL = 'email',
  NUMBER = 'number',
  DATE = 'date',
  DROPDOWN = 'dropdown',
  CHECKBOX = 'checkbox',
}

@Schema({
  _id: false,
})
export class IntakeFormField {
  @Prop({
    required: true,
    maxlength: 64,
  })
  id: string;

  @Prop({
    required: true,
    enum: IntakeFieldType,
  })
  type: IntakeFieldType;

  @Prop({
    required: true,
    maxlength: 200,
  })
  label: string;

  @Prop({
    default: false,
  })
  required: boolean;

  @Prop({
    default: '',
    maxlength: 300,
  })
  placeholder: string;

  @Prop({
    type: [String],
    default: [],
  })
  options: string[];
}

export const IntakeFormFieldSchema =
  SchemaFactory.createForClass(
    IntakeFormField,
  );

@Schema({
  timestamps: true,
  collection: 'intake_forms',
})
export class IntakeForm {
  @Prop({
    type: Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true,
  })
  projectId: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
    maxlength: 120,
  })
  name: string;

  @Prop({
    default: '',
    maxlength: 1000,
  })
  description: string;

  @Prop({
    required: true,
    unique: true,
    index: true,
    lowercase: true,
    trim: true,
  })
  slug: string;

  @Prop({
    default: true,
    index: true,
  })
  enabled: boolean;

  @Prop({
    type: [IntakeFormFieldSchema],
    default: [],
  })
  fields: IntakeFormField[];

  @Prop({
    default:
      'Thanks — your request has been submitted.',
    maxlength: 500,
  })
  successMessage: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  createdBy: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  updatedBy: Types.ObjectId;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  submissionCount: number;

  createdAt: Date;
  updatedAt: Date;
}

export type IntakeFormDocument =
  HydratedDocument<IntakeForm>;

export const IntakeFormSchema =
  SchemaFactory.createForClass(IntakeForm);

IntakeFormSchema.index({
  projectId: 1,
  createdAt: -1,
});

IntakeFormSchema.index({
  projectId: 1,
  enabled: 1,
});
