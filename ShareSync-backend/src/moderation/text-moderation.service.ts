// src/moderation/text-moderation.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// TEXT MODERATION SERVICE — AI-powered content scanning using OpenAI
// Scans user-generated text BEFORE it hits the database
// ═══════════════════════════════════════════════════════════════════════════════

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface ModerationResult {
  flagged: boolean;
  confidence: 'low' | 'medium' | 'high';
  categories: string[];
  action: 'allow' | 'review' | 'block';
  reason?: string;
}

@Injectable()
export class TextModerationService {
  private readonly logger = new Logger(TextModerationService.name);
  private openai: OpenAI | null = null;
  private isEnabled: boolean = false;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.isEnabled = true;
      this.logger.log('✅ Text moderation service initialized with OpenAI');
    } else {
      this.logger.warn('⚠️ OPENAI_API_KEY not set - text moderation DISABLED');
      this.logger.warn('⚠️ All text content will be allowed without scanning');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN MODERATION METHOD
  // Call this before saving ANY user-generated text
  // ═══════════════════════════════════════════════════════════════════════════
  async moderateText(text: string, context?: string): Promise<ModerationResult> {
    // Skip empty text
    if (!text || text.trim().length === 0) {
      return {
        flagged: false,
        confidence: 'low',
        categories: [],
        action: 'allow',
      };
    }

    // If moderation is disabled, allow everything but log
    if (!this.isEnabled || !this.openai) {
      this.logger.debug('Moderation disabled - allowing content');
      return {
        flagged: false,
        confidence: 'low',
        categories: [],
        action: 'allow',
        reason: 'Moderation service not configured',
      };
    }

    try {
      // Use OpenAI Moderation API
      const response = await this.openai.moderations.create({
        input: text,
      });

      const result = response.results[0];

      if (!result.flagged) {
        return {
          flagged: false,
          confidence: 'low',
          categories: [],
          action: 'allow',
        };
      }

      // Analyze flagged categories
      const flaggedCategories: string[] = [];
      const scores: Record<string, number> = {};

      // Map OpenAI categories to human-readable labels
      const categoryMap: Record<string, string> = {
        'hate': 'Hate Speech',
        'hate/threatening': 'Hate/Threats',
        'harassment': 'Harassment',
        'harassment/threatening': 'Harassment/Threats',
        'self-harm': 'Self-Harm',
        'self-harm/intent': 'Self-Harm Intent',
        'self-harm/instructions': 'Self-Harm Instructions',
        'sexual': 'Sexual Content',
        'sexual/minors': 'CSAM',
        'violence': 'Violence',
        'violence/graphic': 'Graphic Violence',
      };

      for (const [key, label] of Object.entries(categoryMap)) {
        const categoryKey = key as keyof typeof result.categories;
        const scoreKey = key as keyof typeof result.category_scores;
        
        if (result.categories[categoryKey]) {
          flaggedCategories.push(label);
          scores[label] = result.category_scores[scoreKey];
        }
      }

      // Determine confidence and action based on max score
      const maxScore = Math.max(...Object.values(scores), 0);
      let confidence: 'low' | 'medium' | 'high';
      let action: 'allow' | 'review' | 'block';

      if (maxScore >= 0.9) {
        confidence = 'high';
        action = 'block';
      } else if (maxScore >= 0.6) {
        confidence = 'medium';
        action = 'review';
      } else {
        confidence = 'low';
        action = 'allow'; // False positive likely
      }

      // IMMEDIATE BLOCK for CSAM - zero tolerance
      if (flaggedCategories.includes('CSAM')) {
        confidence = 'high';
        action = 'block';
        this.logger.error('🚨 CSAM DETECTED - BLOCKED');
      }

      this.logger.warn(
        `Content flagged: ${flaggedCategories.join(', ')} ` +
        `(confidence: ${confidence}, action: ${action})`
      );

      return {
        flagged: true,
        confidence,
        categories: flaggedCategories,
        action,
        reason: `Detected: ${flaggedCategories.join(', ')}`,
      };
    } catch (error) {
      this.logger.error('Moderation API error:', error);
      
      // Fail OPEN for availability, but log for review
      // In production, you might want to fail CLOSED instead
      return {
        flagged: false,
        confidence: 'low',
        categories: [],
        action: 'allow',
        reason: 'Moderation service unavailable',
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BATCH MODERATION
  // For checking multiple texts at once (e.g., importing data)
  // ═══════════════════════════════════════════════════════════════════════════
  async moderateBatch(texts: string[]): Promise<ModerationResult[]> {
    const results: ModerationResult[] = [];

    // Process in chunks of 32 (OpenAI limit)
    for (let i = 0; i < texts.length; i += 32) {
      const chunk = texts.slice(i, i + 32);
      const chunkResults = await Promise.all(
        chunk.map(text => this.moderateText(text))
      );
      results.push(...chunkResults);
    }

    return results;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QUICK CHECK
  // Fast boolean check for simple use cases
  // ═══════════════════════════════════════════════════════════════════════════
  async isContentSafe(text: string): Promise<boolean> {
    const result = await this.moderateText(text);
    return result.action === 'allow';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SERVICE STATUS
  // Check if moderation is enabled
  // ═══════════════════════════════════════════════════════════════════════════
  isServiceEnabled(): boolean {
    return this.isEnabled;
  }
}
