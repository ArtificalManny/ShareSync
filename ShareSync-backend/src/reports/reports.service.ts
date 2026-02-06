// src/reports/reports.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// REPORTS SERVICE: Report generation and data export
// ═══════════════════════════════════════════════════════════════════════════════

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import {
  GenerateReportDto,
  ExportDataDto,
  ReportType,
  ExportFormat,
} from './dto/report.dto';

// We'll use basic JSON/CSV export. For PDF/Excel, you'd add:
// import PDFDocument from 'pdfkit';
// import ExcelJS from 'exceljs';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  private readonly exportsDir = path.join(process.cwd(), 'exports');

  constructor(
    // Inject necessary models
    @InjectModel('Task') private readonly taskModel: Model<any>,
    @InjectModel('Project') private readonly projectModel: Model<any>,
    @InjectModel('Sprint') private readonly sprintModel: Model<any>,
    @InjectModel('User') private readonly userModel: Model<any>,
  ) {
    // Ensure exports directory exists
    if (!fs.existsSync(this.exportsDir)) {
      fs.mkdirSync(this.exportsDir, { recursive: true });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // REPORT GENERATION
  // ─────────────────────────────────────────────────────────────────────────────

  async generateReport(
    userId: string,
    dto: GenerateReportDto,
  ): Promise<{
    metadata: any;
    data: any;
    downloadUrl?: string;
  }> {
    const startDate = dto.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dto.endDate || new Date();

    let reportData: any;
    let title = dto.title;

    switch (dto.type) {
      case ReportType.PROJECT_SUMMARY:
        if (!dto.projectId) throw new BadRequestException('Project ID required');
        reportData = await this.generateProjectSummary(dto.projectId, startDate, endDate);
        title = title || `Project Summary Report`;
        break;

      case ReportType.SPRINT_REPORT:
        if (!dto.sprintId) throw new BadRequestException('Sprint ID required');
        reportData = await this.generateSprintReport(dto.sprintId);
        title = title || `Sprint Report`;
        break;

      case ReportType.TEAM_PRODUCTIVITY:
        if (!dto.projectId) throw new BadRequestException('Project ID required');
        reportData = await this.generateTeamProductivityReport(dto.projectId, startDate, endDate);
        title = title || `Team Productivity Report`;
        break;

      case ReportType.INDIVIDUAL_PERFORMANCE:
        const targetUserId = dto.userIds?.[0] || userId;
        reportData = await this.generateIndividualReport(targetUserId, startDate, endDate, dto.projectId);
        title = title || `Individual Performance Report`;
        break;

      case ReportType.BURNDOWN:
        if (!dto.sprintId) throw new BadRequestException('Sprint ID required');
        reportData = await this.generateBurndownReport(dto.sprintId);
        title = title || `Burndown Report`;
        break;

      case ReportType.VELOCITY:
        if (!dto.projectId) throw new BadRequestException('Project ID required');
        reportData = await this.generateVelocityReport(dto.projectId);
        title = title || `Velocity Report`;
        break;

      default:
        throw new BadRequestException(`Unknown report type: ${dto.type}`);
    }

    const metadata = {
      id: new Types.ObjectId().toString(),
      type: dto.type,
      title,
      generatedAt: new Date(),
      generatedBy: userId,
      dateRange: { start: startDate, end: endDate },
    };

    // Export to file if format specified
    let downloadUrl: string | undefined;
    if (dto.format) {
      const filename = await this.exportToFile(metadata, reportData, dto.format);
      downloadUrl = `/api/reports/download/${filename}`;
    }

    return { metadata, data: reportData, downloadUrl };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // REPORT GENERATORS
  // ─────────────────────────────────────────────────────────────────────────────

  private async generateProjectSummary(
    projectId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    const project = await this.projectModel.findById(projectId);
    if (!project) throw new BadRequestException('Project not found');

    const taskStats = await this.taskModel.aggregate([
      {
        $match: {
          projectId: new Types.ObjectId(projectId),
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const priorityBreakdown = await this.taskModel.aggregate([
      {
        $match: {
          projectId: new Types.ObjectId(projectId),
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
        },
      },
    ]);

    const memberActivity = await this.taskModel.aggregate([
      {
        $match: {
          projectId: new Types.ObjectId(projectId),
          status: 'done',
          completedAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$assignee',
          tasksCompleted: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          userId: '$_id',
          name: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
          tasksCompleted: 1,
        },
      },
      { $sort: { tasksCompleted: -1 } },
    ]);

    return {
      project: {
        id: project._id,
        name: project.name,
        status: project.status,
      },
      tasksByStatus: taskStats.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      tasksByPriority: priorityBreakdown.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      memberActivity,
      period: { start: startDate, end: endDate },
    };
  }

  private async generateSprintReport(sprintId: string): Promise<any> {
    const sprint = await this.sprintModel.findById(sprintId);
    if (!sprint) throw new BadRequestException('Sprint not found');

    const tasks = await this.taskModel.find({
      _id: { $in: sprint.taskIds },
    });

    const completed = tasks.filter((t) => t.status === 'done');
    const incomplete = tasks.filter((t) => t.status !== 'done');

    return {
      sprint: {
        id: sprint._id,
        name: sprint.name,
        number: sprint.sprintNumber,
        status: sprint.status,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
        actualEndDate: sprint.actualEndDate,
      },
      goals: sprint.goals,
      metrics: sprint.metrics,
      burndown: sprint.burndown,
      tasks: {
        total: tasks.length,
        completed: completed.length,
        incomplete: incomplete.length,
        completionRate: tasks.length > 0 
          ? Math.round((completed.length / tasks.length) * 100) 
          : 0,
      },
      retrospective: sprint.retrospective,
    };
  }

  private async generateTeamProductivityReport(
    projectId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    const teamStats = await this.taskModel.aggregate([
      {
        $match: {
          projectId: new Types.ObjectId(projectId),
          completedAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$assignee',
          tasksCompleted: { $sum: 1 },
          avgCompletionTime: { $avg: { $subtract: ['$completedAt', '$createdAt'] } },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          userId: '$_id',
          name: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
          email: '$user.email',
          tasksCompleted: 1,
          avgCompletionTimeHours: { $divide: ['$avgCompletionTime', 1000 * 60 * 60] },
        },
      },
      { $sort: { tasksCompleted: -1 } },
    ]);

    return {
      period: { start: startDate, end: endDate },
      teamMembers: teamStats,
      totals: {
        totalTasksCompleted: teamStats.reduce((sum, m) => sum + m.tasksCompleted, 0),
        avgTasksPerMember: teamStats.length > 0
          ? Math.round(teamStats.reduce((sum, m) => sum + m.tasksCompleted, 0) / teamStats.length)
          : 0,
      },
    };
  }

  private async generateIndividualReport(
    userId: string,
    startDate: Date,
    endDate: Date,
    projectId?: string,
  ): Promise<any> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new BadRequestException('User not found');

    const filter: any = {
      assignee: new Types.ObjectId(userId),
      completedAt: { $gte: startDate, $lte: endDate },
    };
    if (projectId) {
      filter.projectId = new Types.ObjectId(projectId);
    }

    const taskStats = await this.taskModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalCompleted: { $sum: 1 },
          avgCompletionTime: { $avg: { $subtract: ['$completedAt', '$createdAt'] } },
          byPriority: {
            $push: '$priority',
          },
        },
      },
    ]);

    const dailyActivity = await this.taskModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return {
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
      },
      period: { start: startDate, end: endDate },
      summary: taskStats[0] || { totalCompleted: 0, avgCompletionTime: 0 },
      dailyActivity: dailyActivity.map((d) => ({
        date: d._id,
        tasksCompleted: d.count,
      })),
    };
  }

  private async generateBurndownReport(sprintId: string): Promise<any> {
    const sprint = await this.sprintModel.findById(sprintId);
    if (!sprint) throw new BadRequestException('Sprint not found');

    const totalDays = Math.ceil(
      (sprint.endDate.getTime() - sprint.startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const pointsPerDay = sprint.metrics.plannedPoints / totalDays;

    const idealBurndown = [];
    for (let i = 0; i <= totalDays; i++) {
      const date = new Date(sprint.startDate);
      date.setDate(date.getDate() + i);
      idealBurndown.push({
        date,
        points: Math.max(0, sprint.metrics.plannedPoints - pointsPerDay * i),
      });
    }

    return {
      sprint: {
        id: sprint._id,
        name: sprint.name,
        plannedPoints: sprint.metrics.plannedPoints,
      },
      idealBurndown,
      actualBurndown: sprint.burndown,
      analysis: {
        isOnTrack: sprint.burndown.length > 0
          ? sprint.burndown[sprint.burndown.length - 1].remainingPoints <= 
            idealBurndown[sprint.burndown.length - 1]?.points
          : true,
        scopeCreep: sprint.metrics.addedPoints,
      },
    };
  }

  private async generateVelocityReport(projectId: string): Promise<any> {
    const sprints = await this.sprintModel
      .find({
        projectId: new Types.ObjectId(projectId),
        status: 'completed',
      })
      .sort({ endDate: -1 })
      .limit(10);

    const velocities = sprints.map((s) => ({
      sprintId: s._id,
      sprintName: s.name,
      sprintNumber: s.sprintNumber,
      plannedPoints: s.metrics.plannedPoints,
      completedPoints: s.metrics.completedPoints,
      velocity: s.metrics.velocity,
      completionRate: s.metrics.plannedPoints > 0
        ? Math.round((s.metrics.completedPoints / s.metrics.plannedPoints) * 100)
        : 0,
    }));

    const avgVelocity = velocities.length > 0
      ? Math.round(velocities.reduce((sum, v) => sum + v.velocity, 0) / velocities.length)
      : 0;

    return {
      projectId,
      sprints: velocities.reverse(), // Oldest to newest
      averageVelocity: avgVelocity,
      trend: this.calculateTrend(velocities.map((v) => v.velocity)),
    };
  }

  private calculateTrend(values: number[]): 'improving' | 'stable' | 'declining' {
    if (values.length < 3) return 'stable';
    
    const recent = values.slice(-3);
    const older = values.slice(0, 3);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    if (recentAvg > olderAvg * 1.1) return 'improving';
    if (recentAvg < olderAvg * 0.9) return 'declining';
    return 'stable';
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DATA EXPORT
  // ─────────────────────────────────────────────────────────────────────────────

  async exportData(userId: string, dto: ExportDataDto): Promise<{
    filename: string;
    mimeType: string;
    downloadUrl: string;
  }> {
    let data: any[];
    
    switch (dto.dataType) {
      case 'tasks':
        data = await this.exportTasks(dto.projectId, dto.startDate, dto.endDate);
        break;
      case 'users':
        data = await this.exportUsers(dto.projectId);
        break;
      case 'sprints':
        data = await this.exportSprints(dto.projectId);
        break;
      default:
        data = await this.exportAll(dto.projectId);
    }

    const filename = await this.createExportFile(data, dto.format, dto.dataType || 'export');
    
    return {
      filename,
      mimeType: this.getMimeType(dto.format),
      downloadUrl: `/api/reports/download/${filename}`,
    };
  }

  private async exportTasks(
    projectId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<any[]> {
    const filter: any = { projectId: new Types.ObjectId(projectId) };
    if (startDate) filter.createdAt = { $gte: startDate };
    if (endDate) filter.createdAt = { ...filter.createdAt, $lte: endDate };

    const tasks = await this.taskModel
      .find(filter)
      .populate('assignee', 'firstName lastName email')
      .lean();

    return tasks.map((t) => ({
      id: t._id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      assignee: t.assignee 
        ? `${(t.assignee as any).firstName} ${(t.assignee as any).lastName}` 
        : 'Unassigned',
      dueDate: t.dueDate,
      completedAt: t.completedAt,
      createdAt: t.createdAt,
    }));
  }

  private async exportUsers(projectId: string): Promise<any[]> {
    const project = await this.projectModel.findById(projectId).populate('members.userId');
    if (!project) return [];

    return project.members.map((m: any) => ({
      id: m.userId._id,
      name: `${m.userId.firstName} ${m.userId.lastName}`,
      email: m.userId.email,
      role: m.role,
      joinedAt: m.joinedAt,
    }));
  }

  private async exportSprints(projectId: string): Promise<any[]> {
    const sprints = await this.sprintModel
      .find({ projectId: new Types.ObjectId(projectId) })
      .lean();

    return sprints.map((s) => ({
      id: s._id,
      name: s.name,
      number: s.sprintNumber,
      status: s.status,
      startDate: s.startDate,
      endDate: s.endDate,
      plannedPoints: s.metrics?.plannedPoints,
      completedPoints: s.metrics?.completedPoints,
      velocity: s.metrics?.velocity,
    }));
  }

  private async exportAll(projectId: string): Promise<any> {
    return {
      tasks: await this.exportTasks(projectId),
      users: await this.exportUsers(projectId),
      sprints: await this.exportSprints(projectId),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FILE CREATION
  // ─────────────────────────────────────────────────────────────────────────────

  private async createExportFile(
    data: any,
    format: ExportFormat,
    prefix: string,
  ): Promise<string> {
    const timestamp = Date.now();
    let filename: string;
    let content: string | Buffer;

    switch (format) {
      case ExportFormat.JSON:
        filename = `${prefix}-${timestamp}.json`;
        content = JSON.stringify(data, null, 2);
        break;

      case ExportFormat.CSV:
        filename = `${prefix}-${timestamp}.csv`;
        content = this.convertToCSV(data);
        break;

      case ExportFormat.EXCEL:
        // Would use ExcelJS here
        filename = `${prefix}-${timestamp}.xlsx`;
        content = JSON.stringify(data); // Placeholder
        break;

      case ExportFormat.PDF:
        // Would use PDFKit here
        filename = `${prefix}-${timestamp}.pdf`;
        content = JSON.stringify(data); // Placeholder
        break;

      default:
        filename = `${prefix}-${timestamp}.json`;
        content = JSON.stringify(data, null, 2);
    }

    const filepath = path.join(this.exportsDir, filename);
    fs.writeFileSync(filepath, content);

    // Clean up old files (older than 24 hours)
    this.cleanupOldFiles();

    return filename;
  }

  private async exportToFile(
    metadata: any,
    data: any,
    format: ExportFormat,
  ): Promise<string> {
    const report = { metadata, data };
    return this.createExportFile(report, format, metadata.type);
  }

  private convertToCSV(data: any[]): string {
    if (!Array.isArray(data) || data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0]);
    const rows = data.map((item) =>
      headers.map((header) => {
        const value = item[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value).replace(/"/g, '""');
      }).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  private getMimeType(format: ExportFormat): string {
    switch (format) {
      case ExportFormat.JSON: return 'application/json';
      case ExportFormat.CSV: return 'text/csv';
      case ExportFormat.EXCEL: return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case ExportFormat.PDF: return 'application/pdf';
      default: return 'application/octet-stream';
    }
  }

  private cleanupOldFiles(): void {
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const now = Date.now();

    try {
      const files = fs.readdirSync(this.exportsDir);
      for (const file of files) {
        const filepath = path.join(this.exportsDir, file);
        const stats = fs.statSync(filepath);
        if (now - stats.mtimeMs > maxAge) {
          fs.unlinkSync(filepath);
        }
      }
    } catch (error) {
      this.logger.warn(`Error cleaning up export files: ${error.message}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FILE DOWNLOAD
  // ─────────────────────────────────────────────────────────────────────────────

  getFilePath(filename: string): string | null {
    const filepath = path.join(this.exportsDir, filename);
    if (fs.existsSync(filepath)) {
      return filepath;
    }
    return null;
  }
}
