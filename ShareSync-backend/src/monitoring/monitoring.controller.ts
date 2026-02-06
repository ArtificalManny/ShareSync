// src/monitoring/monitoring.controller.ts
// ═══════════════════════════════════════════════════════════════════════════════
// MONITORING CONTROLLER: Metrics and health endpoints
// ═══════════════════════════════════════════════════════════════════════════════

import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MonitoringService } from './monitoring.service';

@ApiTags('Monitoring')
@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  async healthCheck() {
    const health = await this.monitoringService.getHealthStatus();
    return health;
  }

  @Get('metrics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all metrics' })
  async getMetrics(): Promise<any> {

    const [system, app, database] = await Promise.all([
      this.monitoringService.getSystemMetrics(),
      this.monitoringService.getAppMetrics(),
      this.monitoringService.getDatabaseMetrics(),
    ]);

    return {
      success: true,
      data: { system, app, database },
    };
  }

  @Get('metrics/system')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get system metrics' })
  getSystemMetrics(): any {

    return {
      success: true,
      data: this.monitoringService.getSystemMetrics(),
    };
  }

  @Get('metrics/app')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get application metrics' })
  getAppMetrics(): any {

    return {
      success: true,
      data: this.monitoringService.getAppMetrics(),
    };
  }

  @Get('metrics/database')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get database metrics' })
  async getDatabaseMetrics(): Promise<any> {

    return {
      success: true,
      data: await this.monitoringService.getDatabaseMetrics(),
    };
  }
}
