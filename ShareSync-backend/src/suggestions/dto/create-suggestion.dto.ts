import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateSuggestionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100, { message: 'Title cannot exceed 100 characters.' })
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000, { message: 'Content cannot exceed 2000 characters.' })
  content: string;
}
