import {
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import {
  ResponsibilityCriticality,
} from '../schemas/responsibility.schema';

export class CreateResponsibilityDto {
  @IsString()
  @MinLength(1)
  @MaxLength(140)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @IsEnum(ResponsibilityCriticality)
  criticality?: ResponsibilityCriticality;

  @IsOptional()
  @IsMongoId()
  ownerId?: string | null;

  @IsOptional()
  @IsMongoId()
  backupOwnerId?: string | null;
}
