// src/tasks/dto/create-task.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsBoolean, IsDateString, Min, Max, MinLength, MaxLength } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @IsNotEmpty()
  project: string;

  @IsString()
  @IsOptional()
  assignedTo?: string;

  @IsEnum(['low', 'medium', 'high', 'urgent'])
  @IsOptional()
  priority?: string;

  @IsEnum(['low', 'medium', 'high'])
  @IsOptional()
  effort?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(480) // Max 8 hours
  estimatedTime?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(1000)
  xpReward?: number;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  category?: string;

  @IsBoolean()
  @IsOptional()
  countsForStreak?: boolean;

  @IsBoolean()
  @IsOptional()
  isQuickWin?: boolean;

  @IsBoolean()
  @IsOptional()
  visibleToTeam?: boolean;
}