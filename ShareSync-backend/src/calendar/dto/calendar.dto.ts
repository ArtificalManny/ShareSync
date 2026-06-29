import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

// src/calendar/dto/calendar.dto.ts
// ═══════════════════════════════════════════════════════════════════════════════
// CALENDAR DTOs
// ═══════════════════════════════════════════════════════════════════════════════

import { Type } from 'class-transformer';
import { EventType, RecurrenceFrequency } from '../schemas/event.schema';

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class RecurrenceRuleDto {
  @ApiProperty({ enum: RecurrenceFrequency })
  @IsEnum(RecurrenceFrequency)
  frequency: RecurrenceFrequency;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(1)
  @IsOptional()
  interval?: number;

  @ApiPropertyOptional({ type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  daysOfWeek?: number[];

  @ApiPropertyOptional()
  @IsNumber()
  @Min(1)
  @IsOptional()
  dayOfMonth?: number;

  @ApiPropertyOptional()
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  endDate?: Date;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(1)
  @IsOptional()
  occurrences?: number;
}

export class EventReminderDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  minutesBefore: number;

  @ApiPropertyOptional({ enum: ['notification', 'email', 'both'] })
  @IsString()
  @IsOptional()
  method?: string;
}

export class EventLocationDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  meetingUrl?: string;
}

export class EventAttendeeDto {
  @ApiProperty()
  @IsMongoId()
  userId: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isOptional?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE/UPDATE DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class CreateEventDto {
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: EventType })
  @IsEnum(EventType)
  @IsOptional()
  type?: EventType;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  startTime: Date;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  endTime: Date;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isAllDay?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  sprintId?: string;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  linkedTaskId?: string;

  @ApiPropertyOptional({ type: [EventAttendeeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventAttendeeDto)
  @IsOptional()
  attendees?: EventAttendeeDto[];

  @ApiPropertyOptional()
  @ValidateNested()
  @Type(() => EventLocationDto)
  @IsOptional()
  location?: EventLocationDto;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @ApiPropertyOptional()
  @ValidateNested()
  @Type(() => RecurrenceRuleDto)
  @IsOptional()
  recurrence?: RecurrenceRuleDto;

  @ApiPropertyOptional({ type: [EventReminderDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventReminderDto)
  @IsOptional()
  reminders?: EventReminderDto[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;
}

export class UpdateEventDto {
  @ApiPropertyOptional({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  @IsOptional()
  description?: string;

  @IsOptional()
  @IsString()
  notes?: string;



  @ApiPropertyOptional()
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  startTime?: Date;

  @ApiPropertyOptional()
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  endTime?: Date;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isAllDay?: boolean;

  @ApiPropertyOptional()
  @ValidateNested()
  @Type(() => EventLocationDto)
  @IsOptional()
  location?: EventLocationDto;

  @ApiPropertyOptional({ type: [EventReminderDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventReminderDto)
  @IsOptional()
  reminders?: EventReminderDto[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class RespondToEventDto {
  @ApiProperty({ enum: ['accepted', 'declined', 'tentative'] })
  @IsString()
  response: 'accepted' | 'declined' | 'tentative';
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUERY DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class CalendarQueryDto {
  @ApiPropertyOptional()
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional()
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  endDate?: Date;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({ enum: EventType })
  @IsEnum(EventType)
  @IsOptional()
  type?: EventType;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  includeRecurring?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESPONSE DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class CalendarViewDto {
  @ApiProperty()
  date: string;

  @ApiProperty()
  events: any[];
}

export class UpcomingEventsDto {
  @ApiProperty()
  today: any[];

  @ApiProperty()
  tomorrow: any[];

  @ApiProperty()
  thisWeek: any[];

  @ApiProperty()
  upcoming: any[];
}

// ─────────────────────────────────────────────────────────────────────────────
// RE-EXPORTS (generated)
// ─────────────────────────────────────────────────────────────────────────────
