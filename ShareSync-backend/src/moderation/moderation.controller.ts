// src/moderation/moderation.controller.ts
// ═══════════════════════════════════════════════════════════════════════════════
// MODERATION CONTROLLER - User-facing moderation endpoints
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ModerationService } from './moderation.service';

// ═══════════════════════════════════════════════════════════════════════════════
// DTOs
// ═══════════════════════════════════════════════════════════════════════════════

class ReportContentDto {
  contentType: 'project' | 'task' | 'comment' | 'user' | 'file';
  contentId: string;
  reason: string;
  details?: string;
}

class CheckTextDto {
  text: string;
  context?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════

@ApiTags('Moderation')
@Controller('moderation')
export class ModerationController {
  private readonly logger = new Logger(ModerationController.name);

  constructor(private readonly moderationService: ModerationService) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // REPORT CONTENT
  // ─────────────────────────────────────────────────────────────────────────────

  @Post('report')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 3600000 } }) // 20 reports per hour
  @ApiOperation({ summary: 'Report content for moderation review' })
  @ApiResponse({ status: 200, description: 'Report submitted successfully' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async reportContent(@Req() req: any, @Body() dto: ReportContentDto) {
    const userId = req.user?.sub || req.user?.userId;

    this.logger.log(
      `[Report] User ${userId} reported ${dto.contentType}:${dto.contentId} ` +
      `reason="${dto.reason}" details="${dto.details || ''}"`,
    );

    // Log the report for review
    await this.moderationService.logDecision({
      kind: 'other',
      projectId: dto.contentType === 'project' ? dto.contentId : undefined,
      userId,
      decision: 'REVIEW',
      reason: `User report: ${dto.reason}`,
      meta: {
        contentType: dto.contentType,
        contentId: dto.contentId,
        reportedBy: userId,
        details: dto.details,
      },
      ts: Date.now(),
    });

    // In production: Store in moderation_reports collection for human review
    // await this.moderationReportModel.create({
    //   contentType: dto.contentType,
    //   contentId: dto.contentId,
    //   reason: dto.reason,
    //   details: dto.details,
    //   reportedBy: userId,
    //   status: 'pending',
    //   createdAt: new Date(),
    // });

    return {
      success: true,
      message: 'Thank you for your report. We will review it shortly.',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CHECK TEXT (Pre-submission validation)
  // ─────────────────────────────────────────────────────────────────────────────

  @Post('check-text')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 checks per minute
  @ApiOperation({ summary: 'Check text content before submission' })
  @ApiResponse({ status: 200, description: 'Moderation result returned' })
  async checkText(@Req() req: any, @Body() dto: CheckTextDto) {
    const userId = req.user?.sub || req.user?.userId;

    const result = await this.moderationService.moderateContent(
      dto.text,
      'text',
      { userId, throwOnBlock: false },
    );

    return {
      success: true,
      data: {
        allowed: result.allowed,
        decision: result.decision,
        categories: result.flaggedCategories,
        reason: result.reason,
      },
    };
  }
}
