// src/projects/dto/create-project.dto.ts
// ═══════════════════════════════════════════════════════════════════════════════
// CREATE PROJECT DTO
// ═══════════════════════════════════════════════════════════════════════════════

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  MaxLength,
  MinLength,
  Matches,
  IsBoolean,
} from 'class-validator';
import { ProjectVisibility } from '../schemas/project.schema';

export class CreateProjectDto {
  @ApiProperty({
    description: 'Project name',
    example: 'ShareSync MVP',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Project description',
    example: 'Building the best project management tool',
    maxLength: 2000,
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Project icon (emoji)',
    example: '🚀',
    default: '📁',
  })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({
    description: 'Project color (hex)',
    example: '#7C3AED',
    default: '#7C3AED',
  })
  @IsString()
  @IsOptional()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'Color must be a valid hex color code',
  })
  color?: string;

  @ApiPropertyOptional({
    description: 'Project visibility',
    enum: ProjectVisibility,
    default: ProjectVisibility.PRIVATE,
  })
  @IsEnum(ProjectVisibility)
  @IsOptional()
  visibility?: ProjectVisibility;

  @ApiPropertyOptional({
    description: 'Project tags',
    example: ['startup', 'saas'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
