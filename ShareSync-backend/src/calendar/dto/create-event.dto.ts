import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class EventAttendeeDto {
  @ApiProperty({ description: 'User ID of the attendee' })
  @IsMongoId()
  userId: string;

  @ApiPropertyOptional({ description: 'Whether this attendee is optional', default: false })
  @IsOptional()
  @IsBoolean()
  isOptional?: boolean;
}

export class EventReminderDto {
  @ApiProperty({ description: 'Delivery method for reminder', enum: ['email', 'push', 'inApp'] })
  @IsIn(['email', 'push', 'inApp'])
  method: 'email' | 'push' | 'inApp';

  @ApiProperty({ description: 'Minutes before event to send reminder', example: 15, minimum: 0, maximum: 10080 })
  @IsInt()
  @Min(0)
  @Max(10080)
  minutesBefore: number;

  // Your service references `reminders.sent` when selecting + updating.
  // We keep it optional so existing clients don't have to send it.
  @ApiPropertyOptional({ description: 'Whether reminder has already been sent', default: false })
  @IsOptional()
  @IsBoolean()
  sent?: boolean;
}

export class EventRecurrenceDto {
  @ApiProperty({ description: 'Recurrence frequency', enum: ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'] })
  @IsIn(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'])
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

  @ApiPropertyOptional({ description: 'Interval between recurrences', default: 1, minimum: 1, maximum: 365 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  interval?: number;

  @ApiPropertyOptional({ description: 'Stop recurrence at this date (ISO)', example: '2026-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Stop after N occurrences', example: 10, minimum: 1, maximum: 500 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  occurrences?: number;
}

export class CreateEventDto {
  @ApiPropertyOptional({ description: 'Project ID (optional)' })
  @IsOptional()
  @IsMongoId()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Sprint ID (optional)' })
  @IsOptional()
  @IsMongoId()
  sprintId?: string;

  @ApiPropertyOptional({ description: 'Linked task ID (optional)' })
  @IsOptional()
  @IsMongoId()
  linkedTaskId?: string;

  @ApiProperty({ description: 'Event title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Event description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Event type',
    enum: ['focus', 'meeting', 'deadline', 'reminder', 'deep_work', 'standup'],
    default: 'meeting',
  })
  @IsOptional()
  @IsIn(['focus', 'meeting', 'deadline', 'reminder', 'deep_work', 'standup'])
  type?: string;

  @ApiProperty({ description: 'Event start time (ISO)', example: '2026-02-09T18:00:00.000Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ description: 'Event end time (ISO)', example: '2026-02-09T19:00:00.000Z' })
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional({ description: 'All-day event', default: false })
  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;

  @ApiPropertyOptional({ description: 'Timezone', default: 'America/Los_Angeles' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Event location (optional)' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Event color hex', default: '#8B5CF6' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Is recurring', default: false })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({ description: 'Recurrence config (required if isRecurring=true)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => EventRecurrenceDto)
  recurrence?: EventRecurrenceDto;

  @ApiPropertyOptional({ description: 'Attendees list' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventAttendeeDto)
  attendees?: EventAttendeeDto[];

  @ApiPropertyOptional({ description: 'Reminders list' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventReminderDto)
  reminders?: EventReminderDto[];

  @ApiPropertyOptional({ description: 'XP reward for completing/attending', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  xpReward?: number;
}
