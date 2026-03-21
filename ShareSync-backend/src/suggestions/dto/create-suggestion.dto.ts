import { IsString, IsNotEmpty, MaxLength, IsOptional, IsArray } from 'class-validator';

export class CreateSuggestionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100, { message: 'Title cannot exceed 100 characters.' })
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000, { message: 'Content cannot exceed 2000 characters.' })
  content: string;

  // ✅ NEW: Optional attachment URLs (uploaded via /api/uploads/file)
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}
