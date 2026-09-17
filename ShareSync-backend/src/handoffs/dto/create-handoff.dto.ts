import {
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateHandoffDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  context: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  acceptanceCriteria?: string;

  @IsMongoId()
  recipientId: string;

  @IsOptional()
  @IsMongoId()
  sourceMoveId?: string;
}
