// src/legal-hold/legal-hold.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// LEGAL HOLD SERVICE (STUB)
// Compile-safe placeholder so AdminService kill-switch can run.
// Replace later with real evidence storage / snapshots / exports.
// ═══════════════════════════════════════════════════════════════════════════════

import { Injectable, Logger } from '@nestjs/common';

export interface LegalHoldCreatePayload {
  userId: string;
  reason: string;
  details: string;
  adminId: string;
  timestamp: Date;
  contentSnapshot: Record<string, any>;
}

@Injectable()
export class LegalHoldService {
  private readonly logger = new Logger(LegalHoldService.name);

  async createHold(payload: LegalHoldCreatePayload): Promise<{ holdId: string }> {
    this.logger.warn(
      `LEGAL HOLD (stub) created for user=${payload.userId} reason=${payload.reason} admin=${payload.adminId}`,
    );
    return { holdId: `stub-${Date.now()}` };
  }
}
