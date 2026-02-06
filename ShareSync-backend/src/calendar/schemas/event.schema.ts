// src/calendar/schemas/event.schema.ts
// ═══════════════════════════════════════════════════════════════════════════════
// CALENDAR EVENT SCHEMA: Scheduling and deadlines
// ═══════════════════════════════════════════════════════════════════════════════

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

// ═══════════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════════

export enum EventType {
  MEETING = 'meeting',
  DEADLINE = 'deadline',
  MILESTONE = 'milestone',
  REMINDER = 'reminder',
  SPRINT_START = 'sprint_start',
  SPRINT_END = 'sprint_end',
  REVIEW = 'review',
  STANDUP = 'standup',
  RETROSPECTIVE = 'retrospective',
  CUSTOM = 'custom',
}

export enum EventStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  RESCHEDULED = 'rescheduled',
}

export enum RecurrenceFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

@Schema({ _id: false })
export class RecurrenceRule {
  @Prop({ type: String, enum: RecurrenceFrequency, required: true })
  frequency: RecurrenceFrequency;

  @Prop({ type: Number, default: 1 })
  interval: number;

  @Prop({ type: [Number] })
  daysOfWeek?: number[];

  @Prop({ type: Number })
  dayOfMonth?: number;

  @Prop({ type: Date })
  endDate?: Date;

  @Prop({ type: Number })
  occurrences?: number;

  @Prop({ type: [Date], default: [] })
  exceptions: Date[];
}

@Schema({ _id: false })
export class EventReminder {
  @Prop({ type: Number, required: true })
  minutesBefore: number;

  @Prop({ type: String, enum: ['notification', 'email', 'both'], default: 'notification' })
  method: string;

  @Prop({ type: Boolean, default: false })
  sent: boolean;
}

@Schema({ _id: false })
export class EventAttendee {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: ['pending', 'accepted', 'declined', 'tentative'], default: 'pending' })
  responseStatus: string;

  @Prop({ type: Date })
  respondedAt?: Date;

  @Prop({ type: Boolean, default: false })
  isOptional: boolean;

  @Prop({ type: Boolean, default: false })
  isOrganizer: boolean;
}

@Schema({ _id: false })
export class EventLocation {
  @Prop()
  name?: string;

  @Prop()
  address?: string;

  @Prop()
  meetingUrl?: string;

  @Prop()
  roomId?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════

export type CalendarEventDocument = CalendarEvent & Document;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_: any, ret: any) => {
      ret.id = ret._id?.toString?.() ?? String(ret._id);
      delete ret.__v;
      return ret;
    },
  },
})
export class CalendarEvent {
  @ApiProperty({ description: 'Event title' })
  @Prop({ required: true, trim: true, maxlength: 200 })
  title: string;

  @ApiProperty({ description: 'Event description' })
  @Prop({ maxlength: 2000 })
  description?: string;

  @ApiProperty({ enum: EventType })
  @Prop({ type: String, enum: EventType, default: EventType.CUSTOM, index: true })
  type: EventType;

  @ApiProperty({ enum: EventStatus })
  @Prop({ type: String, enum: EventStatus, default: EventStatus.SCHEDULED })
  status: EventStatus;

  @ApiProperty({ description: 'Start time' })
  @Prop({ type: Date, required: true, index: true })
  startTime: Date;

  @ApiProperty({ description: 'End time' })
  @Prop({ type: Date, required: true })
  endTime: Date;

  @ApiProperty({ description: 'Is all-day event' })
  @Prop({ type: Boolean, default: false })
  isAllDay: boolean;

  @ApiProperty({ description: 'Timezone' })
  @Prop({ default: 'UTC' })
  timezone: string;

  @ApiProperty({ description: 'Project ID' })
  @Prop({ type: Types.ObjectId, ref: 'Project', index: true })
  projectId?: Types.ObjectId;

  @ApiProperty({ description: 'Sprint ID' })
  @Prop({ type: Types.ObjectId, ref: 'Sprint' })
  sprintId?: Types.ObjectId;

  @ApiProperty({ description: 'Linked task ID' })
  @Prop({ type: Types.ObjectId, ref: 'Task' })
  linkedTaskId?: Types.ObjectId;

  @ApiProperty({ description: 'Creator ID' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy: Types.ObjectId;

  @ApiProperty({ description: 'Event attendees' })
  @Prop({ type: [EventAttendee], default: [] })
  attendees: EventAttendee[];

  @ApiProperty({ description: 'Event location' })
  @Prop({ type: EventLocation })
  location?: EventLocation;

  @ApiProperty({ description: 'Is recurring event' })
  @Prop({ type: Boolean, default: false })
  isRecurring: boolean;

  @ApiProperty({ description: 'Recurrence rule' })
  @Prop({ type: RecurrenceRule })
  recurrence?: RecurrenceRule;

  @ApiProperty({ description: 'Parent event ID (for recurring instances)' })
  @Prop({ type: Types.ObjectId, ref: 'CalendarEvent' })
  parentEventId?: Types.ObjectId;

  @ApiProperty({ description: 'Occurrence date (for recurring instances)' })
  @Prop({ type: Date })
  occurrenceDate?: Date;

  @ApiProperty({ description: 'Event reminders' })
  @Prop({ type: [EventReminder], default: [{ minutesBefore: 15, method: 'notification' }] })
  reminders: EventReminder[];

  @ApiProperty({ description: 'Event color' })
  @Prop()
  color?: string;

  @ApiProperty({ description: 'Event icon' })
  @Prop()
  icon?: string;

  @ApiProperty({ description: 'Tags' })
  @Prop({ type: [String], default: [] })
  tags: string[];

  @ApiProperty({ description: 'External calendar ID (Google, Outlook)' })
  @Prop()
  externalId?: string;

  @ApiProperty({ description: 'External calendar source' })
  @Prop()
  externalSource?: string;

  @ApiProperty({ description: 'Is private event' })
  @Prop({ type: Boolean, default: false })
  isPrivate: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const CalendarEventSchema = SchemaFactory.createForClass(CalendarEvent);

// ═══════════════════════════════════════════════════════════════════════════════
// INDEXES
// ═══════════════════════════════════════════════════════════════════════════════

CalendarEventSchema.index({ createdBy: 1, startTime: 1 });
CalendarEventSchema.index({ projectId: 1, startTime: 1 });
CalendarEventSchema.index({ 'attendees.userId': 1, startTime: 1 });
CalendarEventSchema.index({ startTime: 1, endTime: 1 });
CalendarEventSchema.index({ parentEventId: 1, occurrenceDate: 1 });

// ═══════════════════════════════════════════════════════════════════════════════
// VIRTUALS
// ═══════════════════════════════════════════════════════════════════════════════

CalendarEventSchema.virtual('duration').get(function () {
  if (!this.startTime || !this.endTime) return 0;
  return Math.round((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60));
});

CalendarEventSchema.virtual('attendeeCount').get(function () {
  return this.attendees?.length || 0;
});

CalendarEventSchema.virtual('isPast').get(function () {
  return this.endTime < new Date();
});

CalendarEventSchema.virtual('isUpcoming').get(function () {
  return this.startTime > new Date();
});
