import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import {
  DecisionStatus,
} from '../schemas/decision.schema';

export class UpdateDecisionDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(300)
  title?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(5000)
  decision?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10000)
  rationale?: string;

  @IsEnum(DecisionStatus)
  @IsOptional()
  status?: DecisionStatus;
}
