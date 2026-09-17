import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import {
  HandoffStatus,
} from '../schemas/handoff.schema';

export class UpdateHandoffDto {
  @IsOptional()
  @IsEnum(HandoffStatus)
  status?: HandoffStatus;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  responseNote?: string;
}
