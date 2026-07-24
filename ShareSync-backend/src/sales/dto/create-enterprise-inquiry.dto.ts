// enterprise-sales-inquiry-backend-v1
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export const ENTERPRISE_TEAM_SIZES = [
  '1-10',
  '11-25',
  '26-100',
  '101-500',
  '501+',
] as const;

export const ENTERPRISE_USE_CASES = [
  'team-collaboration',
  'portfolio-visibility',
  'security-compliance',
  'sso-administration',
  'custom-integrations',
  'other',
] as const;

export class CreateEnterpriseInquiryDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim().toLowerCase()
      : value,
  )
  @IsEmail()
  @MaxLength(254)
  email: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  organization: string;

  @IsIn(ENTERPRISE_TEAM_SIZES)
  teamSize: (typeof ENTERPRISE_TEAM_SIZES)[number];

  @IsIn(ENTERPRISE_USE_CASES)
  useCase: (typeof ENTERPRISE_USE_CASES)[number];

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(40)
  currentPlan?: string;
}
