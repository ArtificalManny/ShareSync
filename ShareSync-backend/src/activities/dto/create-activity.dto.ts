// src/activities/dto/create-activity.dto.ts
import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreateActivityDto {
  @IsString()
  projectId!: string;

  @IsString()
  type!: string; // e.g. "update" or "update.posted"

  @IsString()
  text!: string;

  @IsOptional()
  @IsIn(['public', 'private'])
  visibility?: 'public' | 'private';

  @IsOptional()
  // allow any meta shape
  meta?: Record<string, any>;
}
