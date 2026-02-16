// src/content-reports/content-reports.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT REPORTS SERVICE — User-reported content moderation
// ═══════════════════════════════════════════════════════════════════════════════

import { Injectable, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ContentReport,
  ContentReportDocument,
  ReportStatus,
  ReportReason,
  ContentType,
} from './schemas/content-report.schema';
import { User, UserDocument } from '../user/schemas/user.schema';

// Threshold for auto-hiding content
const AUTO_HIDE_THRESHOLD = 3;
const AUTO_HIDE_WINDOW_HOURS = 24;

// Priority weights by reason (higher = more urgent)
const REASON_PRIORITY: Record<ReportReason, number> = {
  [ReportReason.DANGEROUS_CONTENT]: 100,
  [ReportReason.SEXUAL_CONTENT]: 90,
  [ReportReason.HATE_SPEECH]: 80,
  [ReportReason.HARASSMENT]: 70,
  [ReportReason.IMPERSONATION]: 50,
  [ReportReason.MISINFORMATION]: 40,
  [ReportReason.SPAM]: 30,
  [ReportReason.INTELLECTUAL_PROPERTY]: 20,
  [ReportReason.OTHER]: 10,
};

@Injectable()
export class ContentReportsService {
  private readonly logger = new Logger(ContentReportsService.name);

  constructor(
    @InjectModel(ContentReport.name)
    private contentReportModel: Model<ContentReportDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private eventEmitter: EventEmitter2,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // CREATE REPORT
  // ═══════════════════════════════════════════════════════════════════════════
  async createReport(
    reporterId: string,
    contentType: ContentType,
    contentId: string,
    reportedUserId: string,
    reason: ReportReason,
    additionalContext?: string,
    contentSnapshot?: Record<string, any>,
  ): Promise<ContentReport> {
    // Prevent self-reporting
    if (reporterId === reportedUserId) {
      throw new BadRequestException('You cannot report your own content');
    }

    // Prevent duplicate reports from same user
    const existingReport = await this.contentReportModel.findOne({
      reporterId: new Types.ObjectId(reporterId),
      contentType,
      contentId: new Types.ObjectId(contentId),
      status: { $in: [ReportStatus.PENDING, ReportStatus.UNDER_REVIEW] },
    });

    if (existingReport) {
      throw new BadRequestException('You have already reported this content');
    }

    // Calculate priority based on reason
    const priority = REASON_PRIORITY[reason] || 10;

    // Create report
    const report = await this.contentReportModel.create({
      reporterId: new Types.ObjectId(reporterId),
      contentType,
      contentId: new Types.ObjectId(contentId),
      reportedUserId: new Types.ObjectId(reportedUserId),
      reason,
      additionalContext,
      contentSnapshot,
      priority,
    });

    this.logger.log(
      `📋 Report created: ${contentType}/${contentId} ` +
      `by user ${reporterId} - Reason: ${reason}`
    );

    // Emit event for notifications
    this.eventEmitter.emit('content.reported', {
      reportId: report._id,
      contentType,
      contentId,
      reporterId,
      reportedUserId,
      reason,
    });

    // Check if auto-hide threshold is reached
    await this.checkAutoHideThreshold(contentType, contentId);

    return report;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTO-HIDE CHECK
  // If content gets 3+ reports from unique users in 24 hours, auto-hide it
  // ═══════════════════════════════════════════════════════════════════════════
  private async checkAutoHideThreshold(
    contentType: ContentType,
    contentId: string,
  ): Promise<void> {
    const windowStart = new Date(
      Date.now() - AUTO_HIDE_WINDOW_HOURS * 60 * 60 * 1000
    );

    // Count unique reporters in window
    const reports = await this.contentReportModel.aggregate([
      {
        $match: {
          contentType,
          contentId: new Types.ObjectId(contentId),
          createdAt: { $gte: windowStart },
          status: { $in: [ReportStatus.PENDING, ReportStatus.UNDER_REVIEW] },
        },
      },
      {
        $group: {
          _id: '$reporterId',
        },
      },
      {
        $count: 'uniqueReporters',
      },
    ]);

    const uniqueReporters = reports[0]?.uniqueReporters || 0;

    if (uniqueReporters >= AUTO_HIDE_THRESHOLD) {
      this.logger.warn(
        `🚨 Auto-hiding ${contentType}/${contentId} - ` +
        `${uniqueReporters} unique reporters in ${AUTO_HIDE_WINDOW_HOURS}h`
      );

      // Mark all pending reports as under review
      await this.contentReportModel.updateMany(
        {
          contentType,
          contentId: new Types.ObjectId(contentId),
          status: ReportStatus.PENDING,
        },
        {
          status: ReportStatus.UNDER_REVIEW,
          wasAutoHidden: true,
        }
      );

      // Emit event to hide the content
      this.eventEmitter.emit('content.auto-hidden', {
        contentType,
        contentId,
        uniqueReporters,
      });

      // TODO: Implement actual hiding based on content type
      // This would call the appropriate service
      await this.hideContent(contentType, contentId);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HIDE CONTENT
  // Implementation depends on content type
  // ═══════════════════════════════════════════════════════════════════════════
  private async hideContent(
    contentType: ContentType,
    contentId: string,
  ): Promise<void> {
    // This is a stub - in production, you'd inject the relevant services
    // and call their hide methods
    
    switch (contentType) {
      case ContentType.USER_PROFILE:
        // await this.userService.hideProfile(contentId);
        this.logger.log(`Would hide user profile: ${contentId}`);
        break;
      case ContentType.PROJECT:
        // await this.projectService.hideProject(contentId);
        this.logger.log(`Would hide project: ${contentId}`);
        break;
      case ContentType.TASK:
        // await this.taskService.hideTask(contentId);
        this.logger.log(`Would hide task: ${contentId}`);
        break;
      case ContentType.COMMENT:
        // await this.commentService.hideComment(contentId);
        this.logger.log(`Would hide comment: ${contentId}`);
        break;
      case ContentType.MESSAGE:
        // await this.messageService.hideMessage(contentId);
        this.logger.log(`Would hide message: ${contentId}`);
        break;
      case ContentType.FILE:
        // await this.fileService.hideFile(contentId);
        this.logger.log(`Would hide file: ${contentId}`);
        break;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UNHIDE CONTENT
  // ═══════════════════════════════════════════════════════════════════════════
  private async unhideContent(
    contentType: ContentType,
    contentId: string,
  ): Promise<void> {
    // Stub - implement based on content type
    this.logger.log(`Would unhide ${contentType}: ${contentId}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN: GET PENDING REPORTS
  // ═══════════════════════════════════════════════════════════════════════════
  async getPendingReports(
    page: number = 1,
    limit: number = 20,
    status?: ReportStatus,
    contentType?: ContentType,
    reason?: ReportReason,
  ): Promise<{
    reports: ContentReport[];
    total: number;
    pages: number;
    page: number;
  }> {
    const query: any = {};

    if (status) {
      query.status = status;
    } else {
      query.status = { $in: [ReportStatus.PENDING, ReportStatus.UNDER_REVIEW] };
    }

    if (contentType) {
      query.contentType = contentType;
    }

    if (reason) {
      query.reason = reason;
    }

    const [reports, total] = await Promise.all([
      this.contentReportModel
        .find(query)
        .populate('reporterId', 'firstName lastName username email')
        .populate('reportedUserId', 'firstName lastName username email')
        .sort({ priority: -1, createdAt: 1 }) // High priority first, then oldest
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.contentReportModel.countDocuments(query),
    ]);

    return {
      reports,
      total,
      pages: Math.ceil(total / limit),
      page,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN: GET SINGLE REPORT
  // ═══════════════════════════════════════════════════════════════════════════
  async getReportById(reportId: string): Promise<ContentReport> {
    const report = await this.contentReportModel
      .findById(reportId)
      .populate('reporterId', 'firstName lastName username email')
      .populate('reportedUserId', 'firstName lastName username email')
      .populate('reviewedBy', 'firstName lastName username');

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN: RESOLVE REPORT
  // ═══════════════════════════════════════════════════════════════════════════
  async resolveReport(
    reportId: string,
    adminId: string,
    action: 'remove' | 'keep' | 'dismiss',
    notes?: string,
  ): Promise<ContentReport> {
    const report = await this.contentReportModel.findById(reportId);

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    let status: ReportStatus;
    let actionDescription: string;

    switch (action) {
      case 'remove':
        status = ReportStatus.RESOLVED_REMOVED;
        actionDescription = 'Content removed';
        // Actually delete/hide the content permanently
        await this.hideContent(report.contentType, report.contentId.toString());
        break;

      case 'keep':
        status = ReportStatus.RESOLVED_KEPT;
        actionDescription = 'Content kept (report invalid)';
        // Unhide if it was auto-hidden
        if (report.wasAutoHidden) {
          await this.unhideContent(report.contentType, report.contentId.toString());
        }
        break;

      case 'dismiss':
        status = ReportStatus.DISMISSED;
        actionDescription = 'Report dismissed';
        // Unhide if it was auto-hidden
        if (report.wasAutoHidden) {
          await this.unhideContent(report.contentType, report.contentId.toString());
        }
        break;
    }

    // Update this report
    report.status = status;
    report.reviewedBy = new Types.ObjectId(adminId);
    report.reviewedAt = new Date();
    report.reviewNotes = notes;
    report.actionTaken = actionDescription;
    await report.save();

    // Also resolve all other reports for the same content
    await this.contentReportModel.updateMany(
      {
        contentType: report.contentType,
        contentId: report.contentId,
        _id: { $ne: report._id },
        status: { $in: [ReportStatus.PENDING, ReportStatus.UNDER_REVIEW] },
      },
      {
        status,
        reviewedBy: new Types.ObjectId(adminId),
        reviewedAt: new Date(),
        reviewNotes: `Resolved via report ${reportId}`,
        actionTaken: actionDescription,
      }
    );

    this.logger.log(
      `✅ Report ${reportId} resolved: ${action} by admin ${adminId}`
    );

    // Emit event
    this.eventEmitter.emit('report.resolved', {
      reportId,
      action,
      adminId,
      contentType: report.contentType,
      contentId: report.contentId,
    });

    return report;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GET USER'S REPORTS (their submitted reports)
  // ═══════════════════════════════════════════════════════════════════════════
  async getUserReports(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    reports: ContentReport[];
    total: number;
    pages: number;
  }> {
    const query = { reporterId: new Types.ObjectId(userId) };

    const [reports, total] = await Promise.all([
      this.contentReportModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.contentReportModel.countDocuments(query),
    ]);

    return {
      reports,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GET REPORTS AGAINST USER
  // ═══════════════════════════════════════════════════════════════════════════
  async getReportsAgainstUser(
    userId: string,
    status?: ReportStatus,
  ): Promise<{ reports: ContentReport[]; total: number }> {
    const query: any = { reportedUserId: new Types.ObjectId(userId) };
    
    if (status) {
      query.status = status;
    }

    const [reports, total] = await Promise.all([
      this.contentReportModel
        .find(query)
        .sort({ createdAt: -1 })
        .exec(),
      this.contentReportModel.countDocuments(query),
    ]);

    return { reports, total };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATS FOR ADMIN DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════
  async getReportStats(): Promise<{
    pending: number;
    underReview: number;
    resolvedToday: number;
    byReason: Record<string, number>;
    byContentType: Record<string, number>;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pending, underReview, resolvedToday, byReason, byContentType] = await Promise.all([
      this.contentReportModel.countDocuments({ status: ReportStatus.PENDING }),
      this.contentReportModel.countDocuments({ status: ReportStatus.UNDER_REVIEW }),
      this.contentReportModel.countDocuments({
        status: { $in: [ReportStatus.RESOLVED_REMOVED, ReportStatus.RESOLVED_KEPT, ReportStatus.DISMISSED] },
        reviewedAt: { $gte: today },
      }),
      this.contentReportModel.aggregate([
        { $match: { status: { $in: [ReportStatus.PENDING, ReportStatus.UNDER_REVIEW] } } },
        { $group: { _id: '$reason', count: { $sum: 1 } } },
      ]),
      this.contentReportModel.aggregate([
        { $match: { status: { $in: [ReportStatus.PENDING, ReportStatus.UNDER_REVIEW] } } },
        { $group: { _id: '$contentType', count: { $sum: 1 } } },
      ]),
    ]);

    return {
      pending,
      underReview,
      resolvedToday,
      byReason: byReason.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {} as Record<string, number>),
      byContentType: byContentType.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
