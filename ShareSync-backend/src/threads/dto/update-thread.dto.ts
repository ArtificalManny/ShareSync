// src/threads/dto/update-thread.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import type { ThreadCategory } from './create-thread.dto';

export class UpdateThreadDto {
  @ApiPropertyOptional({ description: 'Thread title' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    description: 'Thread category',
    enum: ['planning', 'design', 'ops', 'general'],
  })
  @IsOptional()
  @IsEnum(['planning', 'design', 'ops', 'general'])
  category?: ThreadCategory;

  // team-room-thread-controls-v2
  @ApiPropertyOptional({
    description: 'Whether this thread is pinned',
  })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiPropertyOptional({
    description: 'Whether this thread is locked',
  })
  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;
}
