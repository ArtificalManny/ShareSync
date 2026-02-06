// src/integrations/dto/integration.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsMongoId,
  IsBoolean,
  IsObject,
  IsUrl,
} from 'class-validator';

export enum IntegrationType {
  GITHUB = 'github',
  SLACK = 'slack',
  DISCORD = 'discord',
  JIRA = 'jira',
  TRELLO = 'trello',
  GOOGLE_CALENDAR = 'google_calendar',
  OUTLOOK = 'outlook',
  WEBHOOK = 'webhook',
}

export class CreateIntegrationDto {
  @ApiProperty({ enum: IntegrationType })
  @IsEnum(IntegrationType)
  type: IntegrationType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  accessToken?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  apiKey?: string;

  @ApiPropertyOptional()
  @IsUrl()
  @IsOptional()
  webhookUrl?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;
}

export class UpdateIntegrationSettingsDto {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  notifyOnTaskComplete?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  notifyOnMention?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  syncTwoWay?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  defaultChannel?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  repository?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  customSettings?: Record<string, any>;
}

export class OAuthCallbackDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  state?: string;
}

export class SlackSendMessageDto {
  @ApiProperty()
  @IsString()
  channel: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  projectId?: string;
}

export class CreateWebhookDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsUrl()
  url: string;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  secret?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  events?: string[];
}
