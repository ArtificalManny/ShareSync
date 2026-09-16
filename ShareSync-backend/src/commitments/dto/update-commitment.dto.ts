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
  CommitmentStatus,
} from '../schemas/commitment.schema';

export class UpdateCommitmentDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(300)
  title?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(5000)
  commitment?: string;

  @IsMongoId()
  @IsOptional()
  ownerId?: string;

  @IsDateString()
  @IsOptional()
  dueAt?: string;

  @IsEnum(CommitmentStatus)
  @IsOptional()
  status?: CommitmentStatus;
}
