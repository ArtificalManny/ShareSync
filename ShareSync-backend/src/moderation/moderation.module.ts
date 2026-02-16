// src/moderation/moderation.module.ts
// ═══════════════════════════════════════════════════════════════════════════════
// MODERATION MODULE — Exports all moderation services
// ═══════════════════════════════════════════════════════════════════════════════

import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TextModerationService } from './text-moderation.service';
import { ImageModerationService } from './image-moderation.service';
import { TextModerationInterceptor } from './moderation.interceptor';

@Global() // Makes services available throughout the app without importing
@Module({
  imports: [ConfigModule],
  providers: [
    TextModerationService,
    ImageModerationService,
    TextModerationInterceptor,
  ],
  exports: [
    TextModerationService,
    ImageModerationService,
    TextModerationInterceptor,
  ],
})
export class ModerationModule {}
