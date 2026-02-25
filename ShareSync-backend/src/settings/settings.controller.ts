// src/settings/settings.controller.ts
import { Controller, Get, Patch, Post, Body, UseGuards, Req } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Settings')
@ApiBearerAuth()
@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user settings' })
  async getSettings(@Req() req: any) {
    const userId = req.user?.sub || req.user?.userId;
    return this.settingsService.getSettingsPlain(userId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update user settings (supports deep merge)' })
  async updateSettings(@Req() req: any, @Body() body: any) {
    const userId = req.user?.sub || req.user?.userId;
    return this.settingsService.updateSettings(userId, body);
  }

  @Post('freeze')
  @ApiOperation({ summary: 'Use monthly streak freeze' })
  async useStreakFreeze(@Req() req: any) {
    const userId = req.user?.sub || req.user?.userId;
    return this.settingsService.useStreakFreeze(userId);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export settings as JSON' })
  async exportSettings(@Req() req: any) {
    const userId = req.user?.sub || req.user?.userId;
    return this.settingsService.exportSettings(userId);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import settings from JSON' })
  async importSettings(@Req() req: any, @Body() body: any) {
    const userId = req.user?.sub || req.user?.userId;
    return this.settingsService.importSettings(userId, body);
  }

  @Post('reset')
  @ApiOperation({ summary: 'Reset all settings to default' })
  async resetSettings(@Req() req: any) {
    const userId = req.user?.sub || req.user?.userId;
    return this.settingsService.resetToDefaults(userId);
  }
}
