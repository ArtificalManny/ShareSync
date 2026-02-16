// src/admin/admin.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN SERVICE — Kill Switch / Emergency Account Takedown
// - Suspends account
// - Invalidates tokens (tokenVersion++)
// - Deletes sessions
// - Hides user content
// - Creates legal hold snapshot
// - Notifies legal for severe categories
// - Creates audit log entry
//
// NOTE:
// This file is intentionally "safe-typed" (Models are `any`) to avoid schema/type
// dependency pitfalls while you stabilize the moderation stack.
// You can tighten types later once the schemas are fully settled.
// ═══════════════════════════════════════════════════════════════════════════════

import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

// If you have a real LegalHoldService, keep this import.
// Otherwise, create a stub service (or adjust the provider) later.
import { LegalHoldService } from '../legal-hold/legal-hold.service';

export type KillSwitchReason = 'csam' | 'terrorism' | 'severe_violation' | 'other';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectModel('User') private readonly userModel: Model<any>,
    @InjectModel('Session') private readonly sessionModel: Model<any>,
    @InjectModel('Project') private readonly projectModel: Model<any>,
    @InjectModel('Mission') private readonly missionModel: Model<any>,
    @InjectModel('Comment') private readonly commentModel: Model<any>,
    @InjectModel('AuditLog') private readonly auditLogModel: Model<any>,
    private readonly legalHoldService: LegalHoldService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // KILL SWITCH (Emergency Takedown)
  // ─────────────────────────────────────────────────────────────────────────────
  async executeKillSwitch(
    targetUserId: string,
    adminId: string,
    reason: KillSwitchReason,
    details: string,
  ): Promise<void> {
    const user = await this.userModel.findById(targetUserId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Log loud, but do NOT leak details to the client
    this.logger.warn(
      `KILL SWITCH ACTIVATED for user ${targetUserId} by admin ${adminId} (reason: ${reason})`,
    );

    // 1) SUSPEND ACCOUNT
    user.status = 'suspended';
    user.suspendedAt = new Date();
    user.suspendedBy = new Types.ObjectId(adminId);
    user.suspensionReason = reason;

    // 2) INVALIDATE ALL TOKENS (increment token version)
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    // 3) NUKE ALL ACTIVE SESSIONS
    await this.sessionModel.deleteMany({ userId: targetUserId });

    // 4) HIDE ALL USER CONTENT
    await Promise.all([
      this.projectModel.updateMany(
        { ownerId: targetUserId },
        {
          isHidden: true,
          hiddenAt: new Date(),
          hiddenReason: 'account_suspended',
        },
      ),
      this.missionModel.updateMany({ createdBy: targetUserId }, { isHidden: true }),
      this.commentModel.updateMany({ authorId: targetUserId }, { isHidden: true }),
    ]);

    // 5) PRESERVE EVIDENCE (Legal hold snapshot)
    const snapshot = await this.snapshotUserContent(targetUserId);

    await this.legalHoldService.createHold({
      userId: targetUserId,
      reason,
      details,
      adminId,
      timestamp: new Date(),
      contentSnapshot: snapshot,
    });

    // 6) NOTIFY LEGAL TEAM (serious violations)
    if (reason === 'csam' || reason === 'terrorism') {
      await this.notifyLegalTeam({
        userId: targetUserId,
        userEmail: user.email,
        userIp: user.lastLoginIp,
        reason,
        details,
        adminId,
      });

      // 7) REPORT TO AUTHORITIES (if applicable)
      // NOTE: In production, this must follow your jurisdictional obligations.
      if (reason === 'csam') {
        await this.reportToNCMEC({
          userId: targetUserId,
          userEmail: user.email,
          userIp: user.lastLoginIp,
          evidenceIds: await this.getEvidenceIds(targetUserId),
        });
      }
    }

    // 8) AUDIT LOG
    await this.auditLogModel.create({
      action: 'KILL_SWITCH',
      targetUserId,
      adminId,
      reason,
      details,
      timestamp: new Date(),
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // INTERNAL: Snapshot user content (for legal hold)
  // ─────────────────────────────────────────────────────────────────────────────
  private async snapshotUserContent(userId: string): Promise<Record<string, any>> {
    // Keep this lightweight and safe.
    // You can expand it later (files, messages, etc.) once those schemas are stable.
    const [projects, missions, comments] = await Promise.all([
      this.projectModel
        .find({ ownerId: userId })
        .select('_id title description createdAt updatedAt isHidden')
        .lean(),
      this.missionModel
        .find({ createdBy: userId })
        .select('_id title content createdAt updatedAt isHidden')
        .lean(),
      this.commentModel
        .find({ authorId: userId })
        .select('_id content createdAt updatedAt isHidden')
        .lean(),
    ]);

    return {
      userId,
      capturedAt: new Date().toISOString(),
      projects,
      missions,
      comments,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // INTERNAL: Notify legal team (stub-safe)
  // ─────────────────────────────────────────────────────────────────────────────
  private async notifyLegalTeam(payload: {
    userId: string;
    userEmail?: string;
    userIp?: string;
    reason: KillSwitchReason;
    details: string;
    adminId: string;
  }): Promise<void> {
    // TODO:
    // - Send email / Slack / PagerDuty
    // - Include legal hold ID if returned by createHold
    this.logger.error(
      `LEGAL NOTIFY: user=${payload.userId} reason=${payload.reason} admin=${payload.adminId}`,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // INTERNAL: Evidence IDs (stub-safe)
  // ─────────────────────────────────────────────────────────────────────────────
  private async getEvidenceIds(userId: string): Promise<string[]> {
    // TODO:
    // - Return LegalHold evidence IDs or storage object keys
    // For now, return empty list to keep compilation stable.
    return [];
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // INTERNAL: Report to authorities (stub-safe)
  // ─────────────────────────────────────────────────────────────────────────────
  private async reportToNCMEC(payload: {
    userId: string;
    userEmail?: string;
    userIp?: string;
    evidenceIds: string[];
  }): Promise<void> {
    // IMPORTANT:
    // Do not implement real reporting logic until you have:
    // - Legal counsel guidance
    // - Jurisdiction requirements
    // - Secure evidence chain + logging
    //
    // This placeholder only logs intent.
    this.logger.error(
      `AUTHORITY REPORT PLACEHOLDER: user=${payload.userId} evidenceCount=${payload.evidenceIds.length}`,
    );
  }
}
