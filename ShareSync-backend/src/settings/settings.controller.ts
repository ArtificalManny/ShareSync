// src/settings/settings.controller.ts
// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS CONTROLLER - REST API for user settings
// Phase 6: Full settings management
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Controller,
  Get,
  Put,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SettingsService } from './settings.service';
import { Settings } from './settings.schema';

@ApiTags('Settings')
@Controller('api/settings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // GET ALL SETTINGS
  // ─────────────────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Get all user settings' })
  @ApiResponse({ status: 200, description: 'Returns all settings' })
  async getSettings(@Request() req) {
    const userId = req.user?.sub || req.user?.userId;
    const settings = await this.settingsService.getSettingsPlain(userId);

    return {
      success: true,
      data: settings,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // UPDATE ALL SETTINGS
  // ─────────────────────────────────────────────────────────────────────────────

  @Put()
  @ApiOperation({ summary: 'Update all user settings' })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  async updateSettings(@Request() req, @Body() update: Partial<Settings>) {
    const userId = req.user?.sub || req.user?.userId;
    const settings = await this.settingsService.updateSettings(userId, update);

    return {
      success: true,
      data: settings,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET SPECIFIC SECTION
  // ─────────────────────────────────────────────────────────────────────────────

  @Get(':section')
  @ApiOperation({ summary: 'Get a specific settings section' })
  @ApiParam({ name: 'section', description: 'Settings section name' })
  async getSection(@Request() req, @Param('section') section: string) {
    const userId = req.user?.sub || req.user?.userId;
    const settings = await this.settingsService.getSettingsPlain(userId);

    const sectionData = settings[section];
    if (sectionData === undefined) {
      return {
        success: false,
        message: `Unknown settings section: ${section}`,
      };
    }

    return {
      success: true,
      data: sectionData,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // UPDATE SPECIFIC SECTION
  // ─────────────────────────────────────────────────────────────────────────────

  @Patch(':section')
  @ApiOperation({ summary: 'Update a specific settings section' })
  @ApiParam({ name: 'section', description: 'Settings section name' })
  async updateSection(
    @Request() req,
    @Param('section') section: string,
    @Body() update: Record<string, any>,
  ) {
    const userId = req.user?.sub || req.user?.userId;

    // Route to specific update methods
    let settings;
    switch (section) {
      case 'notifications':
        settings = await this.settingsService.updateNotifications(userId, update);
        break;
      case 'privacy':
        settings = await this.settingsService.updatePrivacy(userId, update);
        break;
      case 'appearance':
        settings = await this.settingsService.updateAppearance(userId, update);
        break;
      case 'mentor':
        settings = await this.settingsService.updateMentor(userId, update);
        break;
      case 'momentum':
        settings = await this.settingsService.updateMomentum(userId, update);
        break;
      case 'focus':
        settings = await this.settingsService.updateFocus(userId, update);
        break;
      case 'social':
        settings = await this.settingsService.updateSocial(userId, update);
        break;
      case 'presence':
        settings = await this.settingsService.updatePresence(userId, update);
        break;
      default:
        settings = await this.settingsService.updateSection(userId, section, update);
    }

    return {
      success: true,
      data: settings,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STREAK FREEZE
  // ─────────────────────────────────────────────────────────────────────────────

  @Post('streak-freeze')
  @HttpCode(200)
  @ApiOperation({ summary: 'Use a streak freeze' })
  async useStreakFreeze(@Request() req) {
    const userId = req.user?.sub || req.user?.userId;
    const result = await this.settingsService.useStreakFreeze(userId);

    return {
      success: result.success,
      message: result.message,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // EXPORT / IMPORT
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('export/all')
  @ApiOperation({ summary: 'Export all settings' })
  async exportSettings(@Request() req) {
    const userId = req.user?.sub || req.user?.userId;
    const exported = await this.settingsService.exportSettings(userId);

    return {
      success: true,
      data: exported,
    };
  }

  @Post('import')
  @HttpCode(200)
  @ApiOperation({ summary: 'Import settings from export' })
  async importSettings(@Request() req, @Body() imported: Record<string, any>) {
    const userId = req.user?.sub || req.user?.userId;
    const settings = await this.settingsService.importSettings(userId, imported);

    return {
      success: true,
      message: 'Settings imported successfully',
      data: settings,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RESET TO DEFAULTS
  // ─────────────────────────────────────────────────────────────────────────────

  @Post('reset')
  @HttpCode(200)
  @ApiOperation({ summary: 'Reset all settings to defaults' })
  async resetSettings(@Request() req) {
    const userId = req.user?.sub || req.user?.userId;
    const settings = await this.settingsService.resetToDefaults(userId);

    return {
      success: true,
      message: 'Settings reset to defaults',
      data: settings,
    };
  }
}
