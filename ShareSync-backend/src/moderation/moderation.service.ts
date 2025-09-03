// src/moderation/moderation.service.ts
import { Injectable, Logger } from '@nestjs/common';

export type ModerationCategory =
  | 'explicit'
  | 'violence'
  | 'self_harm'
  | 'harassment'
  | 'sensitive';

export type ModerationDecision = 'ALLOW' | 'REVIEW' | 'BLOCK';

export type TextModerationResult = {
  decision: ModerationDecision;
  reason?: string;                 // human-friendly short text
  categories: ModerationCategory[]; // one or more categories flagged
  // Optional raw scores if you wire a real model later:
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
  kind: 'upload' | 'update' | 'avatar' | 'other';
  projectId?: string;
  userId?: string;
  decision: ModerationDecision; // ALLOW | REVIEW | BLOCK
  reason?: string;
  meta?: Record<string, any>;
  ext?: string;
  mime?: string;
  size?: number;
  ts: number;
};

@Injectable()
export class ModerationService {
  private readonly logger = new Logger('Moderation');

  /**
   * TEXT moderation
   * Stub: simple keyword rules → ALLOW/REVIEW/BLOCK with categories.
   * Replace with a real provider (OpenAI safety, Azure, Perspective, etc.).
   */
  async checkText(text: string): Promise<TextModerationResult> {
    const t = String(text || '').toLowerCase();

    const categories: ModerationCategory[] = [];
    const scores: Partial<Record<ModerationCategory, number>> = {};

    const push = (c: ModerationCategory, s = 0.9) => {
      if (!categories.includes(c)) categories.push(c);
      scores[c] = Math.max(scores[c] || 0, s);
    };

    // Very conservative demo rules — customize as needed
    if (/\b(kill|murder|bomb|threat|terror)\b/.test(t)) push('violence', 0.95);
    if (/\b(suicide|self[-\s]?harm|cutting)\b/.test(t)) push('self_harm', 0.95);
    if (/\b(nude|porn|xxx|explicit)\b/.test(t)) push('explicit', 0.9);
    if (/\b(slur1|slur2|idiot|stupid)\b/.test(t)) push('harassment', 0.8); // replace slur placeholders
    if (/\b(ssn|passport|credit\s?card|cvv)\b/.test(t)) push('sensitive', 0.9);

    if (categories.includes('violence') || categories.includes('self_harm') || categories.includes('explicit')) {
      return {
        decision: 'BLOCK',
        reason: this.reasonFromCats(categories, 'Text contains disallowed content.'),
        categories,
        scores,
      };
    }

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

  /**
   * IMAGE moderation
   * Stub: If path extension hints explicit or violent content, flag.
   * Replace with a real vision safety model (e.g., Sightengine, Clarifai, internal).
   */
  async checkImage(fsPathOrBuffer: string | Buffer): Promise<ImageModerationResult> {
    const p = typeof fsPathOrBuffer === 'string' ? fsPathOrBuffer.toLowerCase() : '';
    const categories: ModerationCategory[] = [];
    const scores: Partial<Record<ModerationCategory, number>> = {};

    const push = (c: ModerationCategory, s = 0.9) => {
      if (!categories.includes(c)) categories.push(c);
      scores[c] = Math.max(scores[c] || 0, s);
    };

    // Extremely naive stub heuristics for demo purposes:
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

  /**
   * VIRUS scan
   * Stub: Always clean. Wire to ClamAV/Cloud AV if needed.
   */
  async virusScan(fsPath: string): Promise<VirusScanResult> {
    // TODO: integrate clamdscan or a cloud AV service
    return { infected: false };
  }

  /**
   * Persist/emit moderation decisions (best-effort).
   * For now we just log. You can store in Mongo if you want an audit trail.
   */
  async logDecision(input: LogDecisionInput): Promise<void> {
    const { kind, decision, reason, projectId, userId, ext, mime, size } = input;
    this.logger.log(
      `[${kind}] decision=${decision} reason="${reason || ''}" ` +
        `project=${projectId || '-'} user=${userId || '-'} ext=${ext || '-'} mime=${mime || '-'} size=${size || '-'}`,
    );
    // Optional: write to DB collection `moderation_logs`
  }

  private reasonFromCats(cats: ModerationCategory[], fallback: string): string {
    const pretty = cats
      .map((c) =>
        ({
          explicit: 'nudity/explicit sexual content',
          violence: 'graphic violence',
          self_harm: 'self-harm or suicide',
          harassment: 'harassment/abuse',
          sensitive: 'sensitive personal data',
        }[c] || c),
      )
      .join(', ');
    return pretty ? `Flagged categories: ${pretty}` : fallback;
  }
}