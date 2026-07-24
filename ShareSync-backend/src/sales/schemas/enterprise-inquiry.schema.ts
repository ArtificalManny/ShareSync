// enterprise-sales-inquiry-backend-v1
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  ENTERPRISE_TEAM_SIZES,
  ENTERPRISE_USE_CASES,
} from '../dto/create-enterprise-inquiry.dto';

export type EnterpriseInquiryDocument =
  EnterpriseInquiry & Document;

@Schema({
  timestamps: true,
  collection: 'enterprise_inquiries',
})
export class EnterpriseInquiry {
  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'User',
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
    maxlength: 120,
  })
  name: string;

  @Prop({
    required: true,
    trim: true,
    lowercase: true,
    maxlength: 254,
  })
  email: string;

  @Prop({
    required: true,
    trim: true,
    maxlength: 160,
  })
  organization: string;

  @Prop({
    required: true,
    enum: ENTERPRISE_TEAM_SIZES,
  })
  teamSize: string;

  @Prop({
    required: true,
    enum: ENTERPRISE_USE_CASES,
  })
  useCase: string;

  @Prop({
    trim: true,
    maxlength: 2000,
    default: '',
  })
  message: string;

  @Prop({
    trim: true,
    maxlength: 40,
    default: 'unknown',
  })
  currentPlan: string;

  @Prop({
    enum: ['new', 'contacted', 'qualified', 'closed'],
    default: 'new',
    index: true,
  })
  status: string;

  @Prop({
    default: 'pricing_modal',
  })
  source: string;
}

export const EnterpriseInquirySchema =
  SchemaFactory.createForClass(EnterpriseInquiry);

EnterpriseInquirySchema.index({
  status: 1,
  createdAt: -1,
});

EnterpriseInquirySchema.index({
  email: 1,
  createdAt: -1,
});

EnterpriseInquirySchema.index({
  userId: 1,
  createdAt: -1,
});
