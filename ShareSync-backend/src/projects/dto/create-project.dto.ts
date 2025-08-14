// src/projects/dto/create-project.dto.ts
import { IsArray, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  @MinLength(1)
  description: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsIn(['Not Started', 'In Progress', 'Completed'])
  status?: string;

  @IsOptional()
  @IsIn(['Private', 'Public'])
  privacy?: string;

  @IsOptional()
  @IsArray()
  members?: { email: string; role: string }[];
}