// src/moderation/image-moderation.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// IMAGE MODERATION SERVICE — OpenAI Vision-powered image scanning
// Scans user-uploaded images BEFORE storage
// Uses GPT-4o-mini for content classification (same API key as text moderation)
// ═══════════════════════════════════════════════════════════════════════════════

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import * as crypto from 'crypto';
import * as fs from 'fs';

export interface ImageModerationResult {
  safe: boolean;
  action: 'allow' | 'block' | 'review';
  labels: Array<{
    name: string;
    confidence: number;
    parentName?: string;
  }>;
  hash: string;
  reason?: string;
}

@Injectable()
export class ImageModerationService {
  private readonly logger = new Logger(ImageModerationService.name);
  private openai: OpenAI | null = null;
  private isEnabled: boolean = false;

  // Known illegal content hashes (would connect to NCMEC in production)
  private blockedHashes: Set<string> = new Set();

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.isEnabled = true;
      this.logger.log('Image moderation service initialized with OpenAI Vision');
    } else {
      this.logger.warn('AWS credentials not set - fallback to local mock testing mode');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN IMAGE MODERATION
  // ═══════════════════════════════════════════════════════════════════════════
  async moderateImage(imageInput: Buffer | string): Promise<ImageModerationResult> {
    let imageBuffer: Buffer;
    let hash: string;

    // Handle both Buffer and file path inputs
    if (Buffer.isBuffer(imageInput)) {
      imageBuffer = imageInput;
    } else if (typeof imageInput === 'string' && imageInput.length > 0) {
      try {
        imageBuffer = fs.readFileSync(imageInput);
      } catch {
        this.logger.warn('Could not read image file: ' + imageInput);
        return { safe: true, action: 'allow', labels: [], hash: '', reason: 'File not readable' };
      }
    } else {
      return { safe: true, action: 'allow', labels: [], hash: '', reason: 'No image data' };
    }

    hash = this.generateImageHash(imageBuffer);

    // Check blocked hashes
    if (this.blockedHashes.has(hash)) {
      this.logger.warn('Blocked hash detected: ' + hash.substring(0, 16) + '...');
      return {
        safe: false,
        action: 'block',
        labels: [{ name: 'Known Illegal Content', confidence: 100 }],
        hash,
        reason: 'This image matches known blocked content.',
      };
    }

    // If not enabled, allow but log
    if (!this.isEnabled || !this.openai) {
      this.logger.debug('Image moderation disabled - allowing image');
      return { safe: true, action: 'allow', labels: [], hash };
    }

    try {
      // Convert buffer to base64 for OpenAI Vision
      const mimeType = this.detectMimeType(imageBuffer);

      // OpenAI Vision only supports png, jpeg, gif, webp - skip unsupported formats
      const supportedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!supportedMimes.includes(mimeType)) {
        this.logger.warn('Unsupported image format for Vision API: ' + mimeType + ' - blocking unverifiable image');
        return { safe: false, action: 'block', labels: [{ name: 'Unsupported Format', confidence: 100 }], hash, reason: 'Please upload an image in JPG, PNG, GIF, or WebP format.' };
      }

      const base64Image = imageBuffer.toString('base64');

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 300,
        messages: [
          {
            role: 'system',
            content: `You are a content moderation classifier. Analyze the image and respond ONLY with valid JSON. No other text.

Classify the image into these categories with confidence scores (0-100):
- nudity: explicit nudity or pornography
- suggestive: swimwear, lingerie, provocative poses (NOT nudity)
- violence: graphic violence, gore, weapons used to harm
- csam: any content involving minors in sexual or exploitative contexts
- hate: hate symbols, extremist imagery
- drugs: illegal drug use or paraphernalia
- text_threat: threatening or violent text visible in the image

Respond with this exact JSON format:
{"categories":{"nudity":0,"suggestive":0,"violence":0,"csam":0,"hate":0,"drugs":0,"text_threat":0},"summary":"brief description","action":"allow|review|block"}

Rules for action:
- "block" if nudity >= 80, csam >= 50, violence >= 80, hate >= 80, text_threat >= 80
- "review" if suggestive >= 70, violence >= 50, hate >= 50, drugs >= 60
- "allow" for everything else`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                  detail: 'low',
                },
              },
              {
                type: 'text',
                text: 'Classify this image for content moderation. Respond ONLY with JSON.',
              },
            ],
          },
        ],
      });

      const rawText = response.choices?.[0]?.message?.content || '{}';
      
      // Parse JSON from response (handle markdown fences)
      const cleanJson = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      let parsed: any;
      
      try {
        parsed = JSON.parse(cleanJson);
      } catch {
        this.logger.warn('Failed to parse moderation response: ' + rawText.substring(0, 200));
        // Fail closed for safety
        return {
          safe: false,
          action: 'review',
          labels: [{ name: 'Parse Error', confidence: 0 }],
          hash,
          reason: 'Could not parse moderation result - flagged for review.',
        };
      }

      const cats = parsed.categories || {};
      const action = parsed.action || 'allow';
      const summary = parsed.summary || '';

      // Build labels from high-scoring categories
      const labels: ImageModerationResult['labels'] = [];
      for (const [name, score] of Object.entries(cats)) {
        if (typeof score === 'number' && score > 30) {
          labels.push({ name, confidence: score });
        }
      }

      // Override action for zero-tolerance categories
      let finalAction: 'allow' | 'review' | 'block' = action;
      if ((cats.csam || 0) >= 50) {
        finalAction = 'block';
        this.logger.error('CSAM INDICATOR DETECTED - BLOCKED');
      }
      if ((cats.nudity || 0) >= 80) {
        finalAction = 'block';
      }

      if (finalAction === 'block' || finalAction === 'review') {
        this.logger.warn(
          'Image moderation result: action=' + finalAction + 
          ' labels=' + labels.map(l => l.name + ':' + l.confidence).join(', ') +
          ' summary="' + summary + '"'
        );
      }

      return {
        safe: finalAction === 'allow',
        action: finalAction,
        labels,
        hash,
        reason: finalAction !== 'allow' ? ('Detected: ' + summary) : undefined,
      };
    } catch (error: any) {
      this.logger.error('Image moderation API error: ' + (error?.message || error));

      // Fail CLOSED for images (safety first)
      return {
        safe: false,
        action: 'review',
        labels: [{ name: 'Moderation Error', confidence: 0 }],
        hash,
        reason: 'Image moderation service error - flagged for review.',
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MIME TYPE DETECTION (from magic bytes)
  // ═══════════════════════════════════════════════════════════════════════════
  private detectMimeType(buffer: Buffer): string {
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) return 'image/jpeg';
    if (buffer[0] === 0x89 && buffer[1] === 0x50) return 'image/png';
    if (buffer[0] === 0x47 && buffer[1] === 0x49) return 'image/gif';
    if (buffer[0] === 0x52 && buffer[1] === 0x49) return 'image/webp';
    // AVIF starts with ftyp box
    if (buffer.length > 11 && buffer.slice(4, 8).toString() === 'ftyp') return 'image/avif';
    return 'image/jpeg'; // Default fallback
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HASH GENERATION
  // ═══════════════════════════════════════════════════════════════════════════
  private generateImageHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BLOCK/UNBLOCK HASHES
  // ═══════════════════════════════════════════════════════════════════════════
  addBlockedHash(hash: string): void {
    this.blockedHashes.add(hash);
    this.logger.log('Added hash to block list: ' + hash.substring(0, 16) + '...');
  }

  removeBlockedHash(hash: string): boolean {
    const removed = this.blockedHashes.delete(hash);
    if (removed) this.logger.log('Removed hash from block list: ' + hash.substring(0, 16) + '...');
    return removed;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QUICK CHECK
  // ═══════════════════════════════════════════════════════════════════════════
  async isImageSafe(imageInput: Buffer | string): Promise<boolean> {
    const result = await this.moderateImage(imageInput);
    return result.action === 'allow';
  }

  isServiceEnabled(): boolean {
    return this.isEnabled;
  }

  getBlockedHashCount(): number {
    return this.blockedHashes.size;
  }
}
