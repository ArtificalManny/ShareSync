// src/app.controller.ts
import { Controller, Get } from '@nestjs/common';

@Controller() // <- NO "api" here; global prefix handles it
export class AppController {
  @Get('health')
  health() {
    return { ok: true };
  }
}