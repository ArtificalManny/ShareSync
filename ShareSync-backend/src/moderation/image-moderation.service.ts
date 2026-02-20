// src/moderation/image-moderation.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// IMAGE MODERATION SERVICE — AWS Rekognition-powered image scanning
// Scans user-uploaded images BEFORE they're stored
// ═══════════════════════════════════════════════════════════════════════════════

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  RekognitionClient,
  DetectModerationLabelsCommand,
} from '@aws-sdk/client-rekognition';
import * as crypto from 'crypto';

export interface ImageModerationResult {
  safe: boolean;
  action: 'allow' | 'block';
  labels: Array<{
    name: string;
    confidence: number;
    parentName?: string;
  }>;
  hash: string; // For deduplication
}

@Injectable()
export class ImageModerationService {
  private readonly logger = new Logger(ImageModerationService.name);
  private rekognition: RekognitionClient | null = null;
  private isEnabled: boolean = false;

  // Known illegal content hashes (would connect to NCMEC in production)
  private blockedHashes: Set<string> = new Set();

  constructor(private configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    const region = this.configService.get<string>('AWS_REGION') || 'us-east-1';

    if (accessKeyId && secretAccessKey) {
      this.rekognition = new RekognitionClient({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.isEnabled = true;
      this.logger.log('✅ Image moderation service initialized with AWS Rekognition');
    } else {
      this.logger.warn('⚠️ AWS credentials not set - image moderation DISABLED');
      this.logger.warn('⚠️ All images will be allowed without scanning');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN IMAGE MODERATION
  // Call this before saving ANY user-uploaded image
  // ═══════════════════════════════════════════════════════════════════════════
  async moderateImage(imageBuffer: Buffer): Promise<ImageModerationResult> {
    // SAFEGUARD: Ensure we actually received a valid buffer before attempting to hash
    if (!Buffer.isBuffer(imageBuffer)) {
      this.logger.error('Invalid image buffer provided to moderation service');
      return {
        safe: false,
        action: 'block',
        labels: [{ name: 'Invalid File', confidence: 100 }],
        hash: '',
      };
    }

    // Step 1: Generate hash for deduplication/blocking
    const hash = this.generateImageHash(imageBuffer);

    // Step 2: Check against known blocked hashes
    if (this.blockedHashes.has(hash)) {
      this.logger.warn(`🚨 Blocked hash detected: ${hash.substring(0, 16)}...`);
      return {
        safe: false,
        action: 'block',
        labels: [{ name: 'Known Illegal Content', confidence: 100 }],
        hash,
      };
    }

    // If moderation is disabled, allow but log
    if (!this.isEnabled || !this.rekognition) {
      this.logger.debug('Image moderation disabled - allowing image');
      return {
        safe: true,
        action: 'allow',
        labels: [],
        hash,
      };
    }

    try {
      // Step 3: AWS Rekognition moderation
      const command = new DetectModerationLabelsCommand({
        Image: { Bytes: imageBuffer },
        MinConfidence: 60,
      });

      const response = await this.rekognition.send(command);
      const labels = response.ModerationLabels || [];

      // Check for dangerous content
      const dangerousLabels = [
        'Explicit Nudity',
        'Nudity',
        'Graphic Male Nudity',
        'Graphic Female Nudity',
        'Sexual Activity',
        'Violence',
        'Graphic Violence Or Gore',
        'Visually Disturbing',
        'Hate Symbols',
      ];

      const flaggedLabels = labels.filter(label =>
        dangerousLabels.some(
          d =>
            label.Name?.includes(d) ||
            label.ParentName?.includes(d)
        )
      );

      if (flaggedLabels.length > 0) {
        // Check confidence - high confidence = block
        const maxConfidence = Math.max(
          ...flaggedLabels.map(l => l.Confidence || 0)
        );

        this.logger.warn(
          `Image flagged: ${flaggedLabels.map(l => l.Name).join(', ')} ` +
          `(${maxConfidence.toFixed(1)}% confidence)`
        );

        return {
          safe: false,
          action: maxConfidence >= 80 ? 'block' : 'allow', // High confidence = block
          labels: flaggedLabels.map(l => ({
            name: l.Name || 'Unknown',
            confidence: l.Confidence || 0,
            parentName: l.ParentName,
          })),
          hash,
        };
      }

      return {
        safe: true,
        action: 'allow',
        labels: [],
        hash,
      };
    } catch (error) {
      this.logger.error('Image moderation error:', error);

      // For images, fail CLOSED (block) for safety
      // This is different from text which fails open
      return {
        safe: false,
        action: 'block',
        labels: [{ name: 'Moderation Error', confidence: 0 }],
        hash,
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HASH GENERATION
  // SHA-256 for exact matches. Perceptual hash would be better for variants.
  // ═══════════════════════════════════════════════════════════════════════════
  private generateImageHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BLOCK HASH
  // Add a hash to the block list (called after admin review)
  // ═══════════════════════════════════════════════════════════════════════════
  addBlockedHash(hash: string): void {
    this.blockedHashes.add(hash);
    this.logger.log(`Added hash to block list: ${hash.substring(0, 16)}...`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REMOVE BLOCKED HASH
  // Remove a hash from the block list (in case of false positive)
  // ═══════════════════════════════════════════════════════════════════════════
  removeBlockedHash(hash: string): boolean {
    const removed = this.blockedHashes.delete(hash);
    if (removed) {
      this.logger.log(`Removed hash from block list: ${hash.substring(0, 16)}...`);
    }
    return removed;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QUICK CHECK
  // Fast boolean check for simple use cases
  // ═══════════════════════════════════════════════════════════════════════════
  async isImageSafe(imageBuffer: Buffer): Promise<boolean> {
    const result = await this.moderateImage(imageBuffer);
    return result.action === 'allow';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SERVICE STATUS
  // Check if moderation is enabled
  // ═══════════════════════════════════════════════════════════════════════════
  isServiceEnabled(): boolean {
    return this.isEnabled;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GET BLOCKED HASH COUNT
  // For admin dashboard
  // ═══════════════════════════════════════════════════════════════════════════
  getBlockedHashCount(): number {
    return this.blockedHashes.size;
  }
}
