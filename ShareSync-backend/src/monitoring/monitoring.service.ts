// src/monitoring/monitoring.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// MONITORING SERVICE: Metrics, health checks, and alerts
// ═══════════════════════════════════════════════════════════════════════════════

import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as os from 'os';

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  uptime: number;
}

interface AppMetrics {
  timestamp: Date;
  requests: {
    total: number;
    perSecond: number;
  };
  errors: {
    total: number;
    rate: number;
  };
  latency: {
    avg: number;
    p95: number;
    p99: number;
  };
}

interface DatabaseMetrics {
  timestamp: Date;
  connectionState: string;
  collections: number;
  operations: {
    reads: number;
    writes: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  
  // In-memory metrics storage
  private requestCount = 0;
  private errorCount = 0;
  private latencies: number[] = [];
  private lastResetTime = Date.now();

  constructor(
    @InjectConnection()
    private readonly connection: Connection,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // SYSTEM METRICS
  // ─────────────────────────────────────────────────────────────────────────────

  getSystemMetrics(): SystemMetrics {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    // Calculate CPU usage
    const cpuUsage = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      const idle = cpu.times.idle;
      return acc + ((total - idle) / total) * 100;
    }, 0) / cpus.length;

    return {
      timestamp: new Date(),
      cpu: {
        usage: Math.round(cpuUsage * 100) / 100,
        cores: cpus.length,
      },
      memory: {
        total: totalMemory,
        used: usedMemory,
        free: freeMemory,
        usagePercent: Math.round((usedMemory / totalMemory) * 10000) / 100,
      },
      uptime: os.uptime(),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // APP METRICS
  // ─────────────────────────────────────────────────────────────────────────────

  recordRequest(latencyMs: number, isError: boolean = false): void {
    this.requestCount++;
    this.latencies.push(latencyMs);
    
    if (isError) {
      this.errorCount++;
    }

    // Keep only last 1000 latencies
    if (this.latencies.length > 1000) {
      this.latencies = this.latencies.slice(-1000);
    }
  }

  getAppMetrics(): AppMetrics {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastResetTime) / 1000;

    // Calculate percentiles
    const sorted = [...this.latencies].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    const p99Index = Math.floor(sorted.length * 0.99);

    return {
      timestamp: new Date(),
      requests: {
        total: this.requestCount,
        perSecond: elapsedSeconds > 0 ? this.requestCount / elapsedSeconds : 0,
      },
      errors: {
        total: this.errorCount,
        rate: this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0,
      },
      latency: {
        avg: sorted.length > 0 ? sorted.reduce((a, b) => a + b, 0) / sorted.length : 0,
        p95: sorted[p95Index] || 0,
        p99: sorted[p99Index] || 0,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DATABASE METRICS
  // ─────────────────────────────────────────────────────────────────────────────

  async getDatabaseMetrics(): Promise<DatabaseMetrics> {
    const state = this.connection.readyState;
    const stateMap: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    let collections = 0;
    try {
      const colls = await this.connection.db?.listCollections().toArray();
      collections = colls?.length || 0;
    } catch {
      // Ignore
    }

    return {
      timestamp: new Date(),
      connectionState: stateMap[state] || 'unknown',
      collections,
      operations: {
        reads: 0, // Would need MongoDB profiler
        writes: 0,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HEALTH CHECK
  // ─────────────────────────────────────────────────────────────────────────────

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: {
      name: string;
      status: string;
      message?: string;
    }[];
  }> {
    const checks: { name: string; status: string; message?: string }[] = [];

    // Database check
    try {
      const dbState = this.connection.readyState;
      checks.push({
        name: 'database',
        status: dbState === 1 ? 'healthy' : 'unhealthy',
        message: dbState === 1 ? 'Connected' : 'Not connected',
      });
    } catch (error) {
      checks.push({
        name: 'database',
        status: 'unhealthy',
        message: error.message,
      });
    }

    // Memory check
    const systemMetrics = this.getSystemMetrics();
    checks.push({
      name: 'memory',
      status: systemMetrics.memory.usagePercent < 90 ? 'healthy' : 'degraded',
      message: `${systemMetrics.memory.usagePercent}% used`,
    });

    // Error rate check
    const appMetrics = this.getAppMetrics();
    checks.push({
      name: 'error_rate',
      status: appMetrics.errors.rate < 5 ? 'healthy' : appMetrics.errors.rate < 10 ? 'degraded' : 'unhealthy',
      message: `${appMetrics.errors.rate.toFixed(2)}% error rate`,
    });

    // Determine overall status
    const hasUnhealthy = checks.some((c) => c.status === 'unhealthy');
    const hasDegraded = checks.some((c) => c.status === 'degraded');
    const overallStatus = hasUnhealthy ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy';

    return { status: overallStatus, checks };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ALERTS
  // ─────────────────────────────────────────────────────────────────────────────

  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkAlerts(): Promise<void> {
    const systemMetrics = this.getSystemMetrics();
    const appMetrics = this.getAppMetrics();

    // High memory usage
    if (systemMetrics.memory.usagePercent > 85) {
      this.eventEmitter.emit('alert.memory', {
        type: 'warning',
        message: `High memory usage: ${systemMetrics.memory.usagePercent}%`,
        metrics: systemMetrics.memory,
      });
    }

    // High error rate
    if (appMetrics.errors.rate > 5) {
      this.eventEmitter.emit('alert.errors', {
        type: 'warning',
        message: `High error rate: ${appMetrics.errors.rate.toFixed(2)}%`,
        metrics: appMetrics.errors,
      });
    }

    // High latency
    if (appMetrics.latency.p95 > 1000) {
      this.eventEmitter.emit('alert.latency', {
        type: 'warning',
        message: `High P95 latency: ${appMetrics.latency.p95}ms`,
        metrics: appMetrics.latency,
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RESET
  // ─────────────────────────────────────────────────────────────────────────────

  @Cron(CronExpression.EVERY_HOUR)
  resetMetrics(): void {
    this.requestCount = 0;
    this.errorCount = 0;
    this.latencies = [];
    this.lastResetTime = Date.now();
    this.logger.log('Metrics reset');
  }
}
