// src/moderation/policy.ts
import { ImageModerationResult, VirusScanResult } from './moderation.service';

export type UploadPolicyInput = {
  ext: string;
  mime: string;
  sizeBytes: number;
  virus: VirusScanResult;
  image: ImageModerationResult | null;
};

export type UploadPolicyDecision = {
  decision: 'ALLOW' | 'REVIEW' | 'BLOCK';
  reason?: string;
};

const MAX_BYTES = 50 * 1024 * 1024; // 50MB

export function policyForUpload(input: UploadPolicyInput): UploadPolicyDecision {
  const { ext, mime, sizeBytes, virus, image } = input;

  if (sizeBytes > MAX_BYTES) {
    return { decision: 'BLOCK', reason: `File too large (${Math.round(sizeBytes / (1024 * 1024))}MB).` };
  }

  if (virus?.infected) {
    return { decision: 'BLOCK', reason: 'Virus detected by antivirus.' };
  }

  // Basic disallow list by extension if desired
  const bannedExt = ['exe', 'bat', 'cmd', 'sh', 'ps1'];
  if (bannedExt.includes((ext || '').toLowerCase())) {
    return { decision: 'BLOCK', reason: `Files of type ".${ext}" are not allowed.` };
  }

  // If an image was scanned, honor its decision
  if (image) {
    if (image.decision === 'BLOCK') return { decision: 'BLOCK', reason: image.reason || 'Image blocked by policy.' };
    if (image.decision === 'REVIEW') return { decision: 'REVIEW', reason: image.reason || 'Image requires review.' };
  }

  // Default allow
  return { decision: 'ALLOW' };
}