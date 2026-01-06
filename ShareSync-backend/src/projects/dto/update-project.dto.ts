// src/projects/dto/update-project.dto.ts
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ProjectMemberDto,
  ProjectPrivacy,
  ProjectStatus,
} from './create-project.dto';

const PROJECT_STATUSES = ['active', 'archived', 'completed'] as const;
const PROJECT_PRIVACIES = ['private', 'public'] as const;

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  category?: string;

  @IsOptional()
  @IsIn(PROJECT_STATUSES)
  status?: ProjectStatus;

  @IsOptional()
  @IsIn(PROJECT_PRIVACIES)
  privacy?: ProjectPrivacy;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectMemberDto)
  members?: ProjectMemberDto[];
}
