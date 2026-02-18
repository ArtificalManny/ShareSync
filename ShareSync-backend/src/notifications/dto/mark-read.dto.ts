// src/notifications/dto/mark-read.dto.ts
// ═══════════════════════════════════════════════════════════════════════════════
// MARK READ DTO
// Optional flags (safe). Controllers may ignore body entirely.
// ═══════════════════════════════════════════════════════════════════════════════

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class MarkReadDto {
  @ApiPropertyOptional({ description: 'Mark notification as read', default: true })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @ApiPropertyOptional({ description: 'Mark notification as clicked', default: false })
  @IsOptional()
  @IsBoolean()
  isClicked?: boolean;

  @ApiPropertyOptional({ description: 'Mark notification as dismissed', default: false })
  @IsOptional()
  @IsBoolean()
  isDismissed?: boolean;
}
