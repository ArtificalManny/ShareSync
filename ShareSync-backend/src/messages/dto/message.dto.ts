// src/messages/dto/message.dto.ts
// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGE DTOs
// ═══════════════════════════════════════════════════════════════════════════════

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsMongoId,
  MaxLength,
  IsBoolean,
  ValidateNested,
  ArrayMaxSize,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MessageType, MessageEnergy } from '../schemas/message.schema';
import { ConversationType } from '../schemas/conversation.schema';

// ═══════════════════════════════════════════════════════════════════════════════
// CONVERSATION DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class CreateConversationDto {
  @ApiProperty({ enum: ConversationType })
  @IsEnum(ConversationType)
  type: ConversationType;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Participant user IDs', type: [String] })
  @IsArray()
  @IsMongoId({ each: true })
  participantIds: string[];

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  taskId?: string;
}

export class CreateDirectConversationDto {
  @ApiProperty({ description: 'User ID to start conversation with' })
  @IsMongoId()
  recipientId: string;
}

export class UpdateConversationDto {
  @ApiPropertyOptional({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  icon?: string;
}

export class ConversationSettingsDto {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isMuted?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  notificationsEnabled?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGE DTOs
// ═══════════════════════════════════════════════════════════════════════════════

// messages-verified-attachments-v1
export class SendMessageAttachmentDto {
  @ApiProperty({
    description:
      'Server-issued attachment identifier',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  fileId: string;

  @ApiProperty({
    description:
      'Original attachment filename',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  fileName: string;

  @ApiProperty({
    description:
      'Stored attachment URL',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  fileUrl: string;

  @ApiProperty({
    description:
      'Attachment MIME type',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  mimeType: string;

  @ApiProperty({
    description:
      'Attachment size in bytes',
  })
  @Type(() => Number)
  @IsNumber({
    allowNaN: false,
    allowInfinity: false,
  })
  @Min(0)
  fileSize: number;

  @ApiPropertyOptional({
    description:
      'Optional attachment thumbnail URL',
  })
  @IsString()
  @MaxLength(5000)
  @IsOptional()
  thumbnailUrl?: string;

  @ApiProperty({
    description:
      'Signed authorization proving this attachment passed the Messages upload boundary',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  receipt: string;

  @ApiProperty({
    description:
      'Signed attachment authorization expiry timestamp',
  })
  @Type(() => Number)
  @IsNumber({
    allowNaN: false,
    allowInfinity: false,
  })
  @Min(1)
  receiptExpiresAt: number;
}

export class SendMessageDto {
  @ApiProperty({ description: 'Conversation ID' })
  @IsMongoId()
  conversationId: string;

  @ApiProperty({ description: 'Message content', maxLength: 10000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  content: string;

  @ApiPropertyOptional({ enum: MessageType, default: MessageType.TEXT })
  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType;

  @ApiPropertyOptional({ enum: MessageEnergy, default: MessageEnergy.NORMAL })
  @IsEnum(MessageEnergy)
  @IsOptional()
  energy?: MessageEnergy;

  @ApiPropertyOptional({ description: 'Parent message ID for threading' })
  @IsMongoId()
  @IsOptional()
  threadParentId?: string;

  @ApiPropertyOptional({ description: 'Mentioned user IDs', type: [String] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  mentions?: string[];

  @ApiPropertyOptional({ description: 'Linked task ID' })
  @IsMongoId()
  @IsOptional()
  linkedTaskId?: string;

  @ApiPropertyOptional({
    description:
      'Moderated and server-authorized message attachments',
    type: [SendMessageAttachmentDto],
    maxItems: 5,
  })
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({
    each: true,
  })
  @Type(
    () =>
      SendMessageAttachmentDto,
  )
  @IsOptional()
  attachments?:
    SendMessageAttachmentDto[];

  @ApiPropertyOptional({ description: 'Client-generated message ID for deduplication' })
  @IsString()
  @IsOptional()
  clientMessageId?: string;
}

export class EditMessageDto {
  @ApiProperty({ description: 'New message content', maxLength: 10000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  content: string;
}

export class AddReactionDto {
  @ApiProperty({ description: 'Emoji to add' })
  @IsString()
  @IsNotEmpty()
  emoji: string;
}

export class TypingIndicatorDto {
  @ApiProperty()
  @IsMongoId()
  conversationId: string;

  @ApiProperty()
  @IsBoolean()
  isTyping: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESPONSE DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class ConversationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ConversationType })
  type: ConversationType;

  @ApiPropertyOptional()
  name?: string;

  @ApiProperty()
  participants: any[];

  @ApiPropertyOptional()
  lastMessage?: any;

  @ApiProperty()
  unreadCount: number;

  @ApiProperty()
  lastActivityAt: Date;
}

export class MessageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  conversationId: string;

  @ApiProperty()
  senderId: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ enum: MessageType })
  type: MessageType;

  @ApiProperty({ enum: MessageEnergy })
  energy: MessageEnergy;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  threadParentId?: string;

  @ApiProperty()
  reactions: any[];

  @ApiProperty()
  isEdited: boolean;
}

export class UnreadCountResponseDto {
  @ApiProperty()
  totalUnread: number;

  @ApiProperty()
  conversationCounts: Record<string, number>;
}
