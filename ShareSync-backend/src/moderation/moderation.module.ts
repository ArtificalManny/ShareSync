// src/moderation/moderation.module.ts
// ═══════════════════════════════════════════════════════════════════════════════
// MODERATION MODULE — Exports all moderation services
// ═══════════════════════════════════════════════════════════════════════════════

import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ModerationService } from './moderation.service';
import { TextModerationService } from './text-moderation.service';
import { ImageModerationService } from './image-moderation.service';
import { TextModerationInterceptor } from './moderation.interceptor';

@Global() // Makes services available throughout the app without importing
@Module({
  imports: [ConfigModule],
  providers: [
    // ✅ IMPORTANT: UploadsController injects ModerationService
    ModerationService,

    TextModerationService,
    ImageModerationService,
    TextModerationInterceptor,
  ],
  exports: [
    // ✅ IMPORTANT: Export it so other modules/controllers can inject it
    ModerationService,

    TextModerationService,
    ImageModerationService,
    TextModerationInterceptor,
  ],
})
export class ModerationModule {}
