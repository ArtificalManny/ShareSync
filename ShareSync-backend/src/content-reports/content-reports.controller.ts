// src/content-reports/content-reports.controller.ts
// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT REPORTS CONTROLLER — User reporting endpoints
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ContentReportsService } from './content-reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ContentType,
  ReportReason,
  ReportStatus,
} from './schemas/content-report.schema';

// ═══════════════════════════════════════════════════════════════════════════════
// DTOs
// ═══════════════════════════════════════════════════════════════════════════════

class CreateReportDto {
  contentType: ContentType;
  contentId: string;
  reportedUserId: string;
  reason: ReportReason;
  additionalContext?: string;
  contentSnapshot?: Record<string, any>;
}

class ResolveReportDto {
  action: 'remove' | 'keep' | 'dismiss';
  notes?: string;
}

class PaginationQuery {
  page?: number;
  limit?: number;
}

class ReportsFilterQuery extends PaginationQuery {
  status?: ReportStatus;
  contentType?: ContentType;
  reason?: ReportReason;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════

@Controller('content-reports')
@UseGuards(JwtAuthGuard)
export class ContentReportsController {
  constructor(private readonly reportsService: ContentReportsService) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // USER ENDPOINTS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * POST /content-reports
   * Create a new content report
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 3600000 } }) // Max 10 reports per hour
  async createReport(@Body() dto: CreateReportDto, @Req() req: any) {
    const userId = req.user.sub;

    const report = await this.reportsService.createReport(
      userId,
      dto.contentType,
      dto.contentId,
      dto.reportedUserId,
      dto.reason,
      dto.additionalContext,
      dto.contentSnapshot,
    );

    // SAFETY:
    // Depending on your schema typing, TS may not know about `_id`.
    // Mongoose docs always have `.id` as a string getter, so we safely fallback.
    const reportId = (report as any)?._id?.toString?.() ?? (report as any)?.id;

    return {
      success: true,
      message: 'Report submitted successfully. We will review it shortly.',
      reportId,
    };
  }

  /**
   * GET /content-reports/my-reports
   * Get user's submitted reports
   */
  @Get('my-reports')
  async getMyReports(@Query() query: PaginationQuery, @Req() req: any) {
    const userId = req.user.sub;
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 50);

    return this.reportsService.getUserReports(userId, page, limit);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ADMIN ENDPOINTS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * GET /content-reports/admin/queue
   * Get pending reports for admin review
   */
  @Get('admin/queue')
  // TODO: Add @UseGuards(AdminGuard) when you have admin role checking
  async getAdminQueue(@Query() query: ReportsFilterQuery) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);

    return this.reportsService.getPendingReports(
      page,
      limit,
      query.status,
      query.contentType,
      query.reason,
    );
  }

  /**
   * GET /content-reports/admin/stats
   * Get report statistics for dashboard
   */
  @Get('admin/stats')
  async getAdminStats() {
    return this.reportsService.getReportStats();
  }

  /**
   * GET /content-reports/admin/:id
   * Get single report details
   */
  @Get('admin/:id')
  async getReportById(@Param('id') id: string) {
    return this.reportsService.getReportById(id);
  }

  /**
   * PATCH /content-reports/admin/:id/resolve
   * Resolve a report (admin action)
   */
  @Patch('admin/:id/resolve')
  async resolveReport(
    @Param('id') id: string,
    @Body() dto: ResolveReportDto,
    @Req() req: any,
  ) {
    const adminId = req.user.sub;

    const report = await this.reportsService.resolveReport(
      id,
      adminId,
      dto.action,
      dto.notes,
    );

    return {
      success: true,
      message: `Report ${
        dto.action === 'remove'
          ? 'resolved - content removed'
          : dto.action === 'keep'
          ? 'resolved - content kept'
          : 'dismissed'
      }`,
      report,
    };
  }

  /**
   * GET /content-reports/admin/user/:userId
   * Get all reports against a specific user
   */
  @Get('admin/user/:userId')
  async getReportsAgainstUser(
    @Param('userId') userId: string,
    @Query('status') status?: ReportStatus,
  ) {
    return this.reportsService.getReportsAgainstUser(userId, status);
  }
}
