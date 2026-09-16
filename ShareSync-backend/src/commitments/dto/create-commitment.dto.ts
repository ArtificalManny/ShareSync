import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import {
  CommitmentSourceType,
} from '../schemas/commitment.schema';

export class CreateCommitmentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  commitment: string;

  @IsMongoId()
  ownerId: string;

  @IsDateString()
  dueAt: string;

  @IsEnum(
    CommitmentSourceType,
  )
  @IsOptional()
  sourceType?:
    CommitmentSourceType;

  @IsMongoId()
  @IsOptional()
  sourceMoveId?:
    string | null;
}
