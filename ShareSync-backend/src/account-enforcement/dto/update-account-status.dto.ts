import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export enum AccountStatusDto {
  ACTIVE = 'active',
  WARNED = 'warned',
  SUSPENDED = 'suspended',
  DISABLED = 'disabled',
  BANNED = 'banned',
}

export class UpdateAccountStatusDto {
  @IsEnum(AccountStatusDto)
  status: AccountStatusDto;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  internalNote?: string;

  @IsOptional()
  @IsDateString()
  suspendedUntil?: string;

  @IsOptional()
  @IsMongoId()
  changedBy?: string;
}

export class EnforcementReasonDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  internalNote?: string;

  @IsOptional()
  @IsDateString()
  suspendedUntil?: string;
}
