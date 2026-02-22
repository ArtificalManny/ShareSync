// src/discovery/discovery.controller.ts
// ═══════════════════════════════════════════════════════════════════════════════
// DISCOVERY CONTROLLER - REST API for Discover feed
// Phase 4: Instagram/Twitter-style discovery
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  Req,
  Optional,
} from '@nestjs/common';
import type { Response } from 'express';
import { DiscoveryService } from './discovery.service';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Discovery')
@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // MAIN DISCOVERY FEED (public)
  // ─────────────────────────────────────────────────────────────────────────────

  @Get()
  @UseGuards(RateLimitGuard)
  @ApiOperation({ summary: 'Get discovery feed' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'q', required: false, type: String, description: 'Search query' })
  @ApiQuery({ name: 'sort', required: false, enum: ['recent', 'trending', 'streak', 'popular', 'ships'] })
  @ApiQuery({ name: 'category', required: false, type: String })
  async getDiscoveryFeed(
    @Query() query: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const isProd = process.env.NODE_ENV === 'production';
    const maxAgeSeconds = isProd ? 15 : 5;

    res.setHeader('Cache-Control', `private, max-age=${maxAgeSeconds}, stale-while-revalidate=30`);
    res.setHeader('Vary', 'Authorization, Cookie');

    return this.discoveryService.getDiscoveryFeed(query);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PERSONALIZED FEED (requires auth)
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get personalized discovery feed' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPersonalizedFeed(
    @Req() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    return this.discoveryService.getPersonalizedFeed(
      userId,
      Number(page),
      Number(limit),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TRENDING
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('trending')
  @ApiOperation({ summary: 'Get trending projects' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTrending(@Query('limit') limit = 10) {
    return this.discoveryService.getTrendingProjects(Number(limit));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORIES
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('categories')
  @ApiOperation({ summary: 'Get available categories' })
  async getCategories() {
    return this.discoveryService.getCategories();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DISCOVERY SECTIONS (for Jungle view)
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('sections')
  @ApiOperation({ summary: 'Get discovery sections (Hot Streaks, Quiet but Promising, etc.)' })
  async getDiscoverySections() {
    return this.discoveryService.getDiscoverySections();
  }
}
