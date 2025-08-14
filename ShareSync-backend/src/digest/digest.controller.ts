// src/digest/digest.controller.ts
import { Controller, Get, Post } from '@nestjs/common';
import { DigestService } from './digest.service';

@Controller('digest')
export class DigestController {
  constructor(private readonly digest: DigestService) {}

  @Get('weekly')
  previewWeekly() {
    return this.digest.previewWeekly();
  }

  @Post('weekly/send')
  async sendWeekly() {
    await this.digest.sendWeekly();
    return { ok: true };
  }
}