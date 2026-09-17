import {
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAsyncCheckInDto {
  @IsString()
  @MinLength(1)
  @MaxLength(140)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  prompt?: string;

  @IsOptional()
  @IsDateString()
  dueAt?: string | null;
}
