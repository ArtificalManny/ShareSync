import { ApiPropertyOptional } from '@nestjs/swagger';
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
import { EventAttendeeDto, EventRecurrenceDto, EventReminderDto } from './create-event.dto';

export class UpdateEventDto {
  @ApiPropertyOptional({ description: 'Project ID' })
  @IsOptional()
  @IsMongoId()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Sprint ID' })
  @IsOptional()
  @IsMongoId()
  sprintId?: string;

  @ApiPropertyOptional({ description: 'Linked task ID' })
  @IsOptional()
  @IsMongoId()
  linkedTaskId?: string;

  @ApiPropertyOptional({ description: 'Event title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Event description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Event type',
    enum: ['focus', 'meeting', 'deadline', 'reminder', 'deep_work', 'standup'],
  })
  @IsOptional()
  @IsIn(['focus', 'meeting', 'deadline', 'reminder', 'deep_work', 'standup'])
  type?: string;

  @ApiPropertyOptional({ description: 'Event start time (ISO)' })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional({ description: 'Event end time (ISO)' })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({ description: 'All-day event' })
  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;

  @ApiPropertyOptional({ description: 'Timezone' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Color hex' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Is recurring' })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({ description: 'Recurrence config' })
  @IsOptional()
  @ValidateNested()
  @Type(() => EventRecurrenceDto)
  recurrence?: EventRecurrenceDto;

  @ApiPropertyOptional({ description: 'Attendees list (optional replace/patch by client)' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventAttendeeDto)
  attendees?: EventAttendeeDto[];

  @ApiPropertyOptional({ description: 'Reminders list (optional replace/patch by client)' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventReminderDto)
  reminders?: EventReminderDto[];

  @ApiPropertyOptional({ description: 'XP reward' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  xpReward?: number;

  @ApiPropertyOptional({ description: 'Status', enum: ['scheduled', 'cancelled', 'completed'] })
  @IsOptional()
  @IsIn(['scheduled', 'cancelled', 'completed'])
  status?: string;

  @ApiPropertyOptional({ description: 'Completed at (ISO)' })
  @IsOptional()
  @IsDateString()
  completedAt?: string;
}
