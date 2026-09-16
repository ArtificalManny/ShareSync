import {
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateApprovalDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  request: string;

  @IsMongoId()
  approverId: string;

  @IsOptional()
  @IsMongoId()
  sourceMoveId?: string;
}
