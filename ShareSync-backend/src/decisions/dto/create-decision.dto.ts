import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import {
  DecisionSourceType,
} from '../schemas/decision.schema';

export class CreateDecisionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  decision: string;

  @IsString()
  @IsOptional()
  @MaxLength(10000)
  rationale?: string;

  @IsEnum(DecisionSourceType)
  @IsOptional()
  sourceType?: DecisionSourceType;

  @IsMongoId()
  @IsOptional()
  sourceMoveId?: string | null;
}
