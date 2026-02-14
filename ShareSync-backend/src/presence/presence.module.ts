// src/presence/presence.module.ts
// ═══════════════════════════════════════════════════════════════════════════════
// PRESENCE MODULE
// Registers presence service for dependency injection
// ═══════════════════════════════════════════════════════════════════════════════

import { Module, Global } from '@nestjs/common';
import { PresenceService } from './presence.service';

@Global() // Makes PresenceService available globally
@Module({
  providers: [PresenceService],
  exports: [PresenceService],
})
export class PresenceModule {}
