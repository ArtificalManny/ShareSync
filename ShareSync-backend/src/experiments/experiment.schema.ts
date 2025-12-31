import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ExperimentDocument = Experiment & Document;

@Schema({ timestamps: true })
export class Experiment {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  name: string; // e.g., "Pomodoro vs Flow", "Morning vs Evening"

  @Prop({ required: true })
  type: string; // e.g., "work_schedule", "focus_method", "collaboration_style"

  @Prop({ required: true })
  hypothesis: string; // e.g., "I work better in the morning"

  @Prop({ type: Object })
  settings: {
    control?: any;
    variation?: any;
  };

  @Prop({ default: 'running' })
  status: string; // 'running', 'completed', 'abandoned'

  @Prop({ type: Date })
  startDate: Date;

  @Prop({ type: Date })
  endDate?: Date;

  @Prop({ type: [Object], default: [] })
  dataPoints: Array<{
    date: Date;
    condition: string; // 'control' or 'variation'
    metrics: {
      shipsCompleted?: number;
      focusMinutes?: number;
      energyLevel?: number;
      satisfactionScore?: number;
    };
  }>;

  @Prop({ type: Object })
  results?: {
    winner: string; // 'control', 'variation', 'no_difference'
    confidence: number; // 0-100
    insights: string[];
    recommendation: string;
  };
}

export const ExperimentSchema = SchemaFactory.createForClass(Experiment);
