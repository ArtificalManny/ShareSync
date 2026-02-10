// src/badges/badges.controller.ts
// ═══════════════════════════════════════════════════════════════════════════════
// BADGES CONTROLLER
// - Read-only endpoints by default (safe)
// - Optional seed endpoint (manual) for convenience
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Controller,
  Get,
  Param,
  Query,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BadgesService } from './badges.service';
import { BadgeCategory, BadgeRarity } from './schemas/badge.schema';

@ApiTags('Badges')
@Controller('badges')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  @Get()
  @ApiOperation({ summary: 'List badge definitions' })
  @ApiQuery({ name: 'category', required: false, enum: BadgeCategory })
  @ApiQuery({ name: 'rarity', required: false, enum: BadgeRarity })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async list(
    @Query('category') category?: BadgeCategory,
    @Query('rarity') rarity?: BadgeRarity,
    @Query('activeOnly') activeOnly?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const result = await this.badgesService.list({
      category,
      rarity,
      activeOnly: activeOnly === undefined ? true : activeOnly === 'true',
      search,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    return {
      success: true,
      data: result.badges,
      meta: { total: result.total },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get badge by ID' })
  @ApiParam({ name: 'id', description: 'Badge ID' })
  async getById(@Param('id') id: string) {
    const badge = await this.badgesService.getById(id);
    return { success: true, data: badge };
  }

  @Get('key/:key')
  @ApiOperation({ summary: 'Get badge by key' })
  @ApiParam({ name: 'key', description: 'Badge key (e.g. streak_7)' })
  async getByKey(@Param('key') key: string) {
    const badge = await this.badgesService.getByKey(key);
    return { success: true, data: badge };
  }

  // Safe manual action: does nothing if already seeded
  @Post('seed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Seed default badge definitions (idempotent)' })
  async seedDefaults() {
    const result = await this.badgesService.seedDefaults();
    return { success: true, data: result };
  }
}
