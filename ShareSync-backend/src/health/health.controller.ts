// src/health/health.controller.ts
// ═══════════════════════════════════════════════════════════════════════════════
// HEALTH CHECK CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    @InjectConnection() private readonly connection: Connection,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  check() {
    return {
      success: true,
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Detailed health check with dependencies' })
  async detailedCheck() {
    const dbState = this.connection.readyState;
    const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];

    return {
      success: true,
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      dependencies: {
        database: {
          status: dbState === 1 ? 'healthy' : 'unhealthy',
          state: dbStates[dbState] || 'unknown',
        },
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
