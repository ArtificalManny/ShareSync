import { PartialType } from '@nestjs/mapped-types';
import { CreateSuggestionDto } from './create-suggestion.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateSuggestionDto extends PartialType(CreateSuggestionDto) {
  @IsOptional()
  @IsEnum(['draft', 'internal', 'public'], { message: 'Visibility must be draft, internal, or public' })
  visibility?: string;

  @IsOptional()
  @IsEnum(['open', 'approved', 'rejected', 'completed'])
  status?: string;
}
