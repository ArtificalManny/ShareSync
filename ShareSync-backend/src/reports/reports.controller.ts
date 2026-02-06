// src/reports/reports.controller.ts
// ═══════════════════════════════════════════════════════════════════════════════
// REPORTS CONTROLLER: REST API
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportsService } from './reports.service';
import { GenerateReportDto, ExportDataDto, ReportType } from './dto/report.dto';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate a report' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Report generated' })
  async generateReport(@Req() req: any, @Body() dto: GenerateReportDto) {
    const result = await this.reportsService.generateReport(req.user.userId, dto);
    return { success: true, data: result };
  }

  @Post('export')
  @ApiOperation({ summary: 'Export project data' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Export created' })
  async exportData(@Req() req: any, @Body() dto: ExportDataDto) {
    const result = await this.reportsService.exportData(req.user.userId, dto);
    return { success: true, data: result };
  }

  @Get('download/:filename')
  @ApiOperation({ summary: 'Download exported file' })
  @ApiParam({ name: 'filename', description: 'Filename to download' })
  async downloadFile(@Param('filename') filename: string, @Res() res: Response) {
    const filepath = this.reportsService.getFilePath(filename);
    
    if (!filepath) {
      throw new NotFoundException('File not found or expired');
    }

    // Determine content type
    let contentType = 'application/octet-stream';
    if (filename.endsWith('.json')) contentType = 'application/json';
    else if (filename.endsWith('.csv')) contentType = 'text/csv';
    else if (filename.endsWith('.xlsx')) contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    else if (filename.endsWith('.pdf')) contentType = 'application/pdf';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.sendFile(filepath);
  }

  @Get('types')
  @ApiOperation({ summary: 'Get available report types' })
  async getReportTypes() {
    return {
      success: true,
      data: Object.values(ReportType).map((type) => ({
        value: type,
        label: type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      })),
    };
  }
}
