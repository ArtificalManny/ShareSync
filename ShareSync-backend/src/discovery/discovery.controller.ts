import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { DiscoveryService } from './discovery.service';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';

@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  // ✅ Optional polish: rate limit only this route (avoid global surprises)
  @UseGuards(RateLimitGuard)
  @Get()
  async getDiscoveryFeed(@Query() query: any, @Res({ passthrough: true }) res: Response) {
    // ✅ Optional polish: caching hints only (no data model changes)
    const isProd = process.env.NODE_ENV === 'production';
    const maxAgeSeconds = isProd ? 15 : 5;

    res.setHeader('Cache-Control', `private, max-age=${maxAgeSeconds}, stale-while-revalidate=30`);
    res.setHeader('Vary', 'Authorization, Cookie');

    return this.discoveryService.getDiscoveryFeed(query);
  }
}
