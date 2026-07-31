// src/threads/dto/create-thread.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export type ThreadCategory = 'planning' | 'design' | 'ops' | 'general';

export class CreateThreadDto {
  @ApiProperty({ description: 'Project ID (Mongo ObjectId)' })
  @IsMongoId()
  projectId: string;

  @ApiProperty({ description: 'Thread title' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    description: 'Thread category',
    enum: ['planning', 'design', 'ops', 'general'],
    default: 'general',
  })
  @IsOptional()
  @IsEnum(['planning', 'design', 'ops', 'general'])
  category?: ThreadCategory;

  @ApiPropertyOptional({
    description:
      'Selected project member user IDs',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  participantIds?: string[];

  @ApiPropertyOptional({
    description:
      'Optional initial message content',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;
}
