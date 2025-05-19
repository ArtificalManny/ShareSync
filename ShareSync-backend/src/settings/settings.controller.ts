import { Controller, Get, Put, Body, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SettingsService } from './settings.service';
import { Settings } from './settings.schema'; // Add this import

@Controller('api/settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings(@Request() req) {
    return this.settingsService.getSettings(req.user.sub);
  }

  @Put()
  async updateSettings(@Request() req, @Body() update: Partial<Settings>) {
    return this.settingsService.updateSettings(req.user.sub, update);
  }
}