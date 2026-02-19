// src/milestones/schemas/milestone.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_: any, ret: any) => {
      ret.id = ret._id?.toString();
      delete ret.__v;
      return ret;
    },
  },
})
export class Milestone {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop()
  description: string;

  // ✅ Optional (UI + DTO treat it as optional)
  @Prop({ required: false })
  targetDate?: Date;

  @Prop()
  completedAt: Date;

  @Prop({
    default: 'planned',
    enum: ['planned', 'in_progress', 'completed', 'at_risk'],
    index: true,
  })
  status: string;

  @Prop({ default: 0, min: 0, max: 100 })
  progress: number;

  // ✅ Ensure order is defined so milestones.service.ts doesn't save blind data
  @Prop({ default: 0, index: true })
  order: number;

  @Prop({ type: [Types.ObjectId], ref: 'Task', default: [] })
  taskIds: Types.ObjectId[];

  @Prop({ default: 0 })
  totalTasks: number;

  @Prop({ default: 0 })
  completedTasks: number;

  @Prop({ type: [Types.ObjectId], ref: 'Milestone', default: [] })
  dependsOn: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'Milestone', default: [] })
  blockedBy: Types.ObjectId[];

  @Prop({ default: '#8B5CF6' })
  color: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
}

export type MilestoneDocument = Milestone & Document;
export const MilestoneSchema = SchemaFactory.createForClass(Milestone);

MilestoneSchema.index({ projectId: 1, status: 1 });
MilestoneSchema.index({ targetDate: 1 });
