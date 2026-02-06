// src/files/dto/file.dto.ts
// ═══════════════════════════════════════════════════════════════════════════════
// FILE DTOs
// ═══════════════════════════════════════════════════════════════════════════════

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsMongoId,
  IsNumber,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { FileType } from '../schemas/file.schema';

// ═══════════════════════════════════════════════════════════════════════════════
// FILE DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class CreateFileDto {
  @ApiProperty({ maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  originalName: string;

  @ApiProperty()
  @IsMongoId()
  projectId: string;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  folderId?: string;

  @ApiProperty({ enum: FileType })
  @IsEnum(FileType)
  type: FileType;

  @ApiProperty()
  @IsString()
  mimeType: string;

  @ApiProperty()
  @IsNumber()
  size: number;

  @ApiProperty()
  @IsString()
  url: string;

  @ApiProperty()
  @IsString()
  storageKey: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  linkedTaskId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class UpdateFileDto {
  @ApiPropertyOptional({ maxLength: 255 })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  folderId?: string;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  linkedTaskId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class MoveFileDto {
  @ApiProperty()
  @IsMongoId()
  targetFolderId: string;
}

export class UploadNewVersionDto {
  @ApiProperty()
  @IsString()
  url: string;

  @ApiProperty()
  @IsString()
  storageKey: string;

  @ApiProperty()
  @IsNumber()
  size: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  changelog?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FOLDER DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class CreateFolderDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty()
  @IsMongoId()
  projectId: string;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  icon?: string;
}

export class UpdateFolderDto {
  @ApiPropertyOptional({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  icon?: string;
}

export class MoveFolderDto {
  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  targetParentId?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUERY DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class FileQueryDto {
  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  folderId?: string;

  @ApiPropertyOptional({ enum: FileType })
  @IsEnum(FileType)
  @IsOptional()
  type?: FileType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  starredOnly?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  includeArchived?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sortBy?: 'name' | 'size' | 'createdAt' | 'updatedAt';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  limit?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  offset?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESPONSE DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class FileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: FileType })
  type: FileType;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  size: number;

  @ApiProperty()
  sizeFormatted: string;

  @ApiProperty()
  url: string;

  @ApiPropertyOptional()
  thumbnailUrl?: string;

  @ApiProperty()
  uploadedBy: any;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  isStarred: boolean;
}

export class FolderContentsDto {
  @ApiProperty()
  folder: any;

  @ApiProperty()
  subfolders: any[];

  @ApiProperty()
  files: FileResponseDto[];

  @ApiProperty()
  breadcrumbs: { id: string; name: string }[];

  @ApiProperty()
  totalSize: number;
}
