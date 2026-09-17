import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import {
  AsyncCheckInHealth,
} from '../schemas/async-check-in-response.schema';

export class UpsertAsyncCheckInResponseDto {
  @IsEnum(AsyncCheckInHealth)
  health: AsyncCheckInHealth;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  progress: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  next: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  blockers?: string;
}
