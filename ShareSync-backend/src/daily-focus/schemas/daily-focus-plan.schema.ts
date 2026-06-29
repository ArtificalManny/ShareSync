import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DailyFocusPlanDocument = HydratedDocument<DailyFocusPlan>;

export type DailyFocusPlanStatus = 'suggested' | 'accepted' | 'completed';
export type DailyFocusMoveStatus = 'todo' | 'done' | 'dismissed';
export type DailyFocusSourceType = 'task' | 'milestone' | 'project' | 'custom' | 'system';

@Schema({ _id: false })
export class DailyFocusMove {
  @Prop({ type: String, required: true })
  id: string;

  @Prop({
    type: String,
    enum: ['task', 'milestone', 'project', 'custom', 'system'],
    default: 'task',
  })
  sourceType: DailyFocusSourceType;

  @Prop({ type: Types.ObjectId })
  sourceId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project' })
  projectId?: Types.ObjectId;

  @Prop({ type: String, default: '' })
  projectName?: string;

  @Prop({ type: String, required: true, trim: true })
  title: string;

  @Prop({ type: String, default: '' })
  reason?: string;

  @Prop({ type: String, default: 'normal' })
  priority?: string;

  @Prop({ type: Number, default: 0 })
  score?: number;

  @Prop({ type: Number, default: 0 })
  estimatedMomentum?: number;

  @Prop({ type: Date })
  deadline?: Date;

  @Prop({ type: Number, min: 0, max: 100 })
  progress?: number;

  @Prop({ type: String, default: '' })
  projectColor?: string;

  @Prop({
    type: String,
    enum: ['todo', 'done', 'dismissed'],
    default: 'todo',
  })
  status: DailyFocusMoveStatus;

  @Prop({ type: Date })
  completedAt?: Date;

  @Prop({ type: Date, default: Date.now })
  createdAt?: Date;

  @Prop({ type: Date })
  updatedAt?: Date;
}

export const DailyFocusMoveSchema = SchemaFactory.createForClass(DailyFocusMove);

@Schema({
  timestamps: true,
  collection: 'daily_focus_plans',
})
export class DailyFocusPlan {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true, index: true })
  dateKey: string;

  @Prop({ type: String, default: 'UTC' })
  timezone: string;

  @Prop({
    type: String,
    enum: ['suggested', 'accepted', 'completed'],
    default: 'suggested',
  })
  status: DailyFocusPlanStatus;

  @Prop({ type: [DailyFocusMoveSchema], default: [] })
  selectedMoves: DailyFocusMove[];

  @Prop({ type: [String], default: [] })
  dismissedSuggestionIds: string[];
}

export const DailyFocusPlanSchema = SchemaFactory.createForClass(DailyFocusPlan);

DailyFocusPlanSchema.index({ userId: 1, dateKey: 1 }, { unique: true });
DailyFocusPlanSchema.index({ userId: 1, updatedAt: -1 });
