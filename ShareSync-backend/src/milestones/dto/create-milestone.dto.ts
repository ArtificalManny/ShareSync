import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum, IsMongoId } from 'class-validator';

export enum MilestoneStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  AT_RISK = 'at_risk',
  COMPLETED = 'completed',
}

export class CreateMilestoneDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsMongoId()
  @IsNotEmpty()
  projectId: string;

  @IsOptional()
  @IsDateString()
  targetDate?: string;

  // ✅ Added: allows milestones.service.ts to safely read dto.status
  @IsOptional()
  @IsEnum(MilestoneStatus)
  status?: MilestoneStatus;
}
