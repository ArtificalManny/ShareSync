// src/moderation/moderation.module.ts
// ═══════════════════════════════════════════════════════════════════════════════
// MODERATION MODULE - Coordinates all moderation services
// ═══════════════════════════════════════════════════════════════════════════════

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ModerationService } from './moderation.service';
import { TextModerationService } from './text-moderation.service';
import { ImageModerationService } from './image-moderation.service';
import { ModerationController } from './moderation.controller';

@Module({
  imports: [ConfigModule],
  controllers: [ModerationController],
  providers: [
    ModerationService,
    TextModerationService,
    ImageModerationService,
  ],
  exports: [
    ModerationService,
    TextModerationService,
    ImageModerationService,
  ],
})
export class ModerationModule {}
