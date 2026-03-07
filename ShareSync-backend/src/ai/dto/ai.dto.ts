import { IsString, IsOptional, IsArray } from 'class-validator';

export enum SuggestionType {
  MOMENTUM = 'momentum',
  BLOCKER = 'blocker',
  WORKLOAD = 'workload',
  GENERAL = 'general'
}

export class ChatRequestDto {
  @IsString()
  prompt: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  scope?: string;

  @IsOptional()
  @IsArray()
  items?: any[];
}
