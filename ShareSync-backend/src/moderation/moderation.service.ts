// src/moderation/moderation.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// MODERATION SERVICE - Main Orchestrator
// Coordinates text moderation, image moderation, and virus scanning
// ═══════════════════════════════════════════════════════════════════════════════

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { CONTENT_POLICY, shouldBlock, shouldReview, getHighestSeverity } from './policy';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS (existing - preserved)
// ═══════════════════════════════════════════════════════════════════════════════

export type ModerationCategory =
  | 'explicit'
  | 'violence'
  | 'self_harm'
  | 'harassment'
  | 'sensitive'
  | 'hate_speech'
  | 'terrorism'
  | 'child_exploitation'
  | 'spam';

export type ModerationDecision = 'ALLOW' | 'REVIEW' | 'BLOCK';

export type TextModerationResult = {
  decision: ModerationDecision;
  reason?: string;
  categories: ModerationCategory[];
  scores?: Partial<Record<ModerationCategory, number>>;
};

export type ImageModerationResult = TextModerationResult;

export type VirusScanResult = {
  infected: boolean;
  engine?: string;
  signature?: string;
  reason?: string;
};

export type LogDecisionInput = {
  kind: 'upload' | 'update' | 'avatar' | 'text' | 'image' | 'other';
  projectId?: string;
  userId?: string;
  decision: ModerationDecision;
  reason?: string;
  meta?: Record<string, any>;
  ext?: string;
  mime?: string;
  size?: number;
  ts: number;
};

// ═══════════════════════════════════════════════════════════════════════════════
// NEW: Generic moderation result type (for orchestrator)
// ═══════════════════════════════════════════════════════════════════════════════

export type ContentType = 'text' | 'image';

export type ModerationResult = {
  allowed: boolean;
  decision: ModerationDecision;
  flaggedCategories: string[];
  confidence: number;
  reason: string | null;
};

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

@Injectable()
export class ModerationService {
  private readonly logger = new Logger('Moderation');

  // ─────────────────────────────────────────────────────────────────────────────
  // MAIN ORCHESTRATOR METHOD (NEW)
  // Use this as the single entry point for all moderation checks
  // ─────────────────────────────────────────────────────────────────────────────

  async moderateContent(
    content: string | Buffer,
    type: ContentType,
    context?: { userId?: string; projectId?: string; throwOnBlock?: boolean },
  ): Promise<ModerationResult> {
    let result: ModerationResult;

    if (type === 'text') {
      const textResult = await this.checkText(content as string);
      result = {
        allowed: textResult.decision === 'ALLOW',
        decision: textResult.decision,
        flaggedCategories: textResult.categories,
        confidence: textResult.scores ? Math.max(...Object.values(textResult.scores)) : 1.0,
        reason: textResult.reason || null,
      };
    } else if (type === 'image') {
      const imageResult = await this.checkImage(content as Buffer);
      result = {
        allowed: imageResult.decision === 'ALLOW',
        decision: imageResult.decision,
        flaggedCategories: imageResult.categories,
        confidence: imageResult.scores ? Math.max(...Object.values(imageResult.scores)) : 1.0,
        reason: imageResult.reason || null,
      };
    } else {
      throw new BadRequestException('Unsupported content type');
    }

    // Log for audit trail
    await this.logDecision({
      kind: type,
      projectId: context?.projectId,
      userId: context?.userId,
      decision: result.decision,
      reason: result.reason || undefined,
      meta: { categories: result.flaggedCategories },
      ts: Date.now(),
    });

    // Optionally throw on BLOCK (for use in interceptors/guards)
    if (context?.throwOnBlock && result.decision === 'BLOCK') {
      throw new BadRequestException({
        code: 'CONTENT_POLICY_VIOLATION',
        message: result.reason || CONTENT_POLICY.MESSAGES.blocked,
        categories: result.flaggedCategories,
      });
    }

    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEXT MODERATION (existing - preserved + enhanced)
  // ─────────────────────────────────────────────────────────────────────────────

  async checkText(text: string): Promise<TextModerationResult> {
    const t = String(text || '').toLowerCase();

    const categories: ModerationCategory[] = [];
    const scores: Partial<Record<ModerationCategory, number>> = {};

    const push = (c: ModerationCategory, s = 0.9) => {
      if (!categories.includes(c)) categories.push(c);
      scores[c] = Math.max(scores[c] || 0, s);
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // RULE-BASED DETECTION (fast, deterministic)
    // In production, complement with ML-based API (OpenAI, Perspective, etc.)
    // ═══════════════════════════════════════════════════════════════════════════

    // Violence patterns
    if (/\b(kill|murder|bomb|threat|terror|attack)\b/i.test(t) && 
        /\b(you|them|him|her|people|everyone)\b/i.test(t)) {
      push('violence', 0.95);
    }

    // Self-harm patterns
    if (/\b(suicide|self[-\s]?harm|cutting|end\s+my\s+life)\b/i.test(t)) {
      push('self_harm', 0.95);
    }

    // Explicit content
    if (/\b(nude|porn|xxx|explicit|nsfw)\b/i.test(t)) {
      push('explicit', 0.9);
    }

    // Harassment (basic patterns)
    if (/\b(idiot|stupid|loser|worthless)\b/i.test(t) &&
        /\b(you|your)\b/i.test(t)) {
      push('harassment', 0.8);
    }

    // Sensitive data exposure
    if (/\b(ssn|passport|credit\s?card|cvv|bank\s?account)\b/i.test(t) &&
        /\d{4,}/i.test(t)) {
      push('sensitive', 0.9);
    }

    // Spam patterns (URLs, excessive repetition)
    if ((t.match(/https?:\/\//g) || []).length > 3) {
      push('spam' as ModerationCategory, 0.7);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DETERMINE DECISION
    // ═══════════════════════════════════════════════════════════════════════════

    // Immediate BLOCK categories
    if (categories.includes('violence') || 
        categories.includes('self_harm') || 
        categories.includes('explicit')) {
      return {
        decision: 'BLOCK',
        reason: this.reasonFromCats(categories, 'Text contains disallowed content.'),
        categories,
        scores,
      };
    }

    // REVIEW categories
    if (categories.length > 0) {
      return {
        decision: 'REVIEW',
        reason: this.reasonFromCats(categories, 'Text may require review.'),
        categories,
        scores,
      };
    }

    return { decision: 'ALLOW', categories: [], scores };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // IMAGE MODERATION (existing - preserved)
  // ─────────────────────────────────────────────────────────────────────────────

  async checkImage(fsPathOrBuffer: string | Buffer): Promise<ImageModerationResult> {
    const p = typeof fsPathOrBuffer === 'string' ? fsPathOrBuffer.toLowerCase() : '';
    const categories: ModerationCategory[] = [];
    const scores: Partial<Record<ModerationCategory, number>> = {};

    const push = (c: ModerationCategory, s = 0.9) => {
      if (!categories.includes(c)) categories.push(c);
      scores[c] = Math.max(scores[c] || 0, s);
    };

    // Filename-based heuristics (very basic - use real image scanning in production)
    if (p.includes('nsfw') || p.includes('explicit')) push('explicit', 0.95);
    if (p.includes('gore') || p.includes('violent')) push('violence', 0.95);

    if (categories.includes('explicit') || categories.includes('violence')) {
      return {
        decision: 'BLOCK',
        reason: this.reasonFromCats(categories, 'Image contains disallowed content.'),
        categories,
        scores,
      };
    }

    if (categories.length > 0) {
      return {
        decision: 'REVIEW',
        reason: this.reasonFromCats(categories, 'Image may require review.'),
        categories,
        scores,
      };
    }

    return { decision: 'ALLOW', categories: [], scores };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // VIRUS SCAN (existing - preserved)
  // ─────────────────────────────────────────────────────────────────────────────

  async virusScan(fsPath: string): Promise<VirusScanResult> {
    // TODO: integrate clamdscan or a cloud AV service
    return { infected: false };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // AUDIT LOGGING (existing - preserved)
  // ─────────────────────────────────────────────────────────────────────────────

  async logDecision(input: LogDecisionInput): Promise<void> {
    const { kind, decision, reason, projectId, userId, ext, mime, size, meta } = input;
    
    this.logger.log(
      `[${kind}] decision=${decision} reason="${reason || ''}" ` +
      `project=${projectId || '-'} user=${userId || '-'} ` +
      `ext=${ext || '-'} mime=${mime || '-'} size=${size || '-'}`,
    );

    // In production: Write to MongoDB collection `moderation_logs`
    // await this.moderationLogModel.create({
    //   kind,
    //   decision,
    //   reason,
    //   projectId,
    //   userId,
    //   meta,
    //   createdAt: new Date(),
    // });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HELPER METHODS
  // ─────────────────────────────────────────────────────────────────────────────

  private reasonFromCats(cats: ModerationCategory[], fallback: string): string {
    const pretty = cats
      .map((c) =>
        ({
          explicit: 'nudity/explicit sexual content',
          violence: 'graphic violence',
          self_harm: 'self-harm or suicide',
          harassment: 'harassment/abuse',
          sensitive: 'sensitive personal data',
          hate_speech: 'hate speech',
          terrorism: 'terrorism-related content',
          child_exploitation: 'child exploitation',
          spam: 'spam',
        }[c] || c),
      )
      .join(', ');
    return pretty ? `Flagged categories: ${pretty}` : fallback;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // QUICK HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Quick check if text content is safe (doesn't throw)
   */
  async isTextSafe(text: string): Promise<boolean> {
    const result = await this.checkText(text);
    return result.decision === 'ALLOW';
  }

  /**
   * Quick check if image content is safe (doesn't throw)
   */
  async isImageSafe(imageBuffer: Buffer): Promise<boolean> {
    const result = await this.checkImage(imageBuffer);
    return result.decision === 'ALLOW';
  }
}
