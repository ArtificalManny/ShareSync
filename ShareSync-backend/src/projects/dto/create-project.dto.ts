// backend/src/projects/dto/create-project.dto.ts
import { IsOptional, IsString, IsArray, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export const PROJECT_STATUSES = ['Not Started', 'In Progress', 'Completed'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_PRIVACIES = ['Private', 'Public'] as const;
export type ProjectPrivacy = (typeof PROJECT_PRIVACIES)[number];

export class ProjectMemberDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsString()
  @IsIn(['owner', 'member', 'viewer'])
  role: 'owner' | 'member' | 'viewer'; // REQUIRED
}

export class CreateProjectDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  @IsIn(PROJECT_STATUSES as unknown as string[])
  status?: ProjectStatus;

  @IsOptional()
  @IsString()
  @IsIn(PROJECT_PRIVACIES as unknown as string[])
  privacy?: ProjectPrivacy;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectMemberDto)
  members?: ProjectMemberDto[];
}
