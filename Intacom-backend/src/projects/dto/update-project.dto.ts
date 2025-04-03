import { IsOptional, IsString, IsArray } from 'class-validator';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  admin?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsArray()
  sharedWith?: { userId: string; role: string }[];

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  tasks?: string[];

  @IsOptional()
  timeline?: {
    startDate: string;
    endDate: string;
    milestones: { name: string; date: string }[];
  };

  @IsOptional()
  likes?: number;

  @IsOptional()
  comments?: number;
}