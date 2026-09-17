import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  Types,
} from 'mongoose';

export enum ResponsibilityCriticality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum ResponsibilityStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

@Schema({
  timestamps: true,
  collection: 'responsibilities',
})
export class Responsibility {
  @Prop({
    type: Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true,
  })
  projectId: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    trim: true,
    maxlength: 140,
  })
  title: string;

  @Prop({
    type: String,
    default: '',
    trim: true,
    maxlength: 1200,
  })
  description: string;

  @Prop({
    type: String,
    default: '',
    trim: true,
    maxlength: 80,
  })
  category: string;

  @Prop({
    type: String,
    enum: ResponsibilityCriticality,
    default: ResponsibilityCriticality.MEDIUM,
    required: true,
  })
  criticality: ResponsibilityCriticality;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  })
  ownerId?: Types.ObjectId | null;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    default: null,
  })
  backupOwnerId?: Types.ObjectId | null;

  @Prop({
    type: String,
    enum: ResponsibilityStatus,
    default: ResponsibilityStatus.ACTIVE,
    required: true,
    index: true,
  })
  status: ResponsibilityStatus;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  createdBy: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    default: null,
  })
  archivedBy?: Types.ObjectId | null;

  @Prop({
    type: Date,
    default: null,
  })
  archivedAt?: Date | null;
}

export type ResponsibilityDocument =
  HydratedDocument<Responsibility>;

export const ResponsibilitySchema =
  SchemaFactory.createForClass(
    Responsibility,
  );

ResponsibilitySchema.index({
  projectId: 1,
  status: 1,
  createdAt: -1,
});

ResponsibilitySchema.index({
  projectId: 1,
  ownerId: 1,
  status: 1,
});

ResponsibilitySchema.index({
  projectId: 1,
  criticality: 1,
  status: 1,
});
