import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import {
  TaskPriority,
  TaskStatus,
} from '../../tasks/schemas/task.schema';
import {
  IntakeSubmissionStatus,
} from '../schemas/intake-submission.schema';

export class UpdateIntakeSubmissionStatusDto {
  @ApiProperty({
    enum: IntakeSubmissionStatus,
  })
  @IsEnum(IntakeSubmissionStatus)
  status: IntakeSubmissionStatus;
}

export class ConvertIntakeSubmissionDto {
  @ApiPropertyOptional({
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @ApiPropertyOptional({
    maxLength: 10000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string;

  @ApiPropertyOptional({
    enum: TaskStatus,
  })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({
    enum: TaskPriority,
  })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  assigneeId?: string;
}
