import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import {
  ApprovalStatus,
} from '../schemas/approval.schema';

export class UpdateApprovalDto {
  @IsOptional()
  @IsEnum(ApprovalStatus)
  status?: ApprovalStatus;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  responseNote?: string;
}
