import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import {
  AsyncCheckInStatus,
} from '../schemas/async-check-in.schema';

export class UpdateAsyncCheckInDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(140)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  prompt?: string;

  @IsOptional()
  @IsDateString()
  dueAt?: string | null;

  @IsOptional()
  @IsEnum(AsyncCheckInStatus)
  status?: AsyncCheckInStatus;
}
