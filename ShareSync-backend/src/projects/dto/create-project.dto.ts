// backend/src/projects/dto/create-project.dto.ts
import { IsOptional, IsString, IsArray, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

class ProjectMemberDto {
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
  @IsIn(['Not Started', 'In Progress', 'Completed'])
  status?: string;

  @IsOptional()
  @IsString()
  @IsIn(['Private', 'Public'])
  privacy?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectMemberDto)
  members?: ProjectMemberDto[];
}