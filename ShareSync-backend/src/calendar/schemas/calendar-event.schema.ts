import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
export class EventRecurrence {
  @Prop({ enum: ['daily', 'weekly', 'monthly', 'yearly'], required: true })
  frequency: string;

  @Prop({ default: 1 })
  interval: number;

  @Prop()
  endDate: Date;

  @Prop({ type: [Number], default: [] })
  daysOfWeek: number[];
}

@Schema({ _id: false })
export class EventAttendee {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ enum: ['pending', 'accepted', 'declined', 'tentative'], default: 'pending' })
  status: string;

  @Prop()
  respondedAt: Date;
}

@Schema({ _id: false })
export class EventReminder {
  @Prop({ enum: ['email', 'push', 'inApp'], required: true })
  type: string;

  @Prop({ required: true })
  minutesBefore: number;
}

@Schema({ timestamps: true })
export class CalendarEvent {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project', index: true })
  projectId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ 
    required: true,
    enum: ['focus', 'meeting', 'deadline', 'reminder', 'deep_work', 'standup'],
    default: 'meeting'
  })
  type: string;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({ default: false })
  isAllDay: boolean;

  @Prop({ default: 'America/Los_Angeles' })
  timezone: string;

  @Prop({ type: EventRecurrence })
  recurrence: EventRecurrence;

  @Prop({ default: 0 })
  xpReward: number;

  @Prop({ type: Types.ObjectId, ref: 'Task' })
  linkedTaskId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Sprint' })
  linkedSprintId: Types.ObjectId;

  @Prop({ type: [EventAttendee], default: [] })
  attendees: EventAttendee[];

  @Prop({ type: [EventReminder], default: [] })
  reminders: EventReminder[];

  @Prop({ enum: ['scheduled', 'cancelled', 'completed'], default: 'scheduled' })
  status: string;

  @Prop()
  completedAt: Date;

  @Prop({ default: '#8B5CF6' })
  color: string;
}

export type CalendarEventDocument = CalendarEvent & Document;
export const CalendarEventSchema = SchemaFactory.createForClass(CalendarEvent);

CalendarEventSchema.index({ userId: 1, startTime: 1 });
CalendarEventSchema.index({ projectId: 1, startTime: 1 });
CalendarEventSchema.index({ startTime: 1, endTime: 1 });
