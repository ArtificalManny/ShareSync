// src/projects/dto/update-project-settings.dto.ts
import { IsBoolean, IsOptional, IsEnum } from 'class-validator';

export class UpdateProjectSettingsDto {
  @IsBoolean()
  @IsOptional()
  allowPublicSuggestions?: boolean;

  @IsBoolean()
  @IsOptional()
  requireApproval?: boolean;

  @IsBoolean()
  @IsOptional()
  notifyOnTaskComplete?: boolean;

  @IsBoolean()
  @IsOptional()
  notifyOnNewMember?: boolean;

  @IsEnum(['easy', 'medium', 'hard'])
  @IsOptional()
  defaultTaskDifficulty?: string;
}