// src/moderation/policy.ts
// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT POLICY DEFINITIONS
// Defines what content is allowed, requires review, or is blocked
// ═══════════════════════════════════════════════════════════════════════════════

import { ImageModerationResult, VirusScanResult } from './moderation.service';

// ═══════════════════════════════════════════════════════════════════════════════
// UPLOAD POLICY (existing - preserved)
// ═══════════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT POLICY (NEW - from blueprint)
// ═══════════════════════════════════════════════════════════════════════════════

export const CONTENT_POLICY = {
  // ─────────────────────────────────────────────────────────────────────────────
  // Categories that result in IMMEDIATE block - ZERO TOLERANCE
  // ─────────────────────────────────────────────────────────────────────────────
  BLOCK_CATEGORIES: [
    'child_exploitation',    // CSAM - zero tolerance, report to authorities
    'csam',                  // Alias
    'terrorism',             // Terror content, radicalization
    'explicit_violence',     // Gore, torture, extreme violence
    'illegal_content',       // Drug sales, weapons trafficking
    'doxxing',               // Personal information exposure
    'threats',               // Direct threats of violence
  ],

  // ─────────────────────────────────────────────────────────────────────────────
  // Categories that result in WARNING + human review queue
  // ─────────────────────────────────────────────────────────────────────────────
  WARN_CATEGORIES: [
    'adult_content',         // NSFW but legal
    'hate_speech',           // Discriminatory content
    'harassment',            // Targeted abuse
    'self_harm',             // Suicide/self-injury content
    'spam',                  // Promotional spam
    'misinformation',        // False claims about health, elections, etc.
    'impersonation',         // Pretending to be someone else
  ],

  // ─────────────────────────────────────────────────────────────────────────────
  // Categories that are allowed but logged for patterns
  // ─────────────────────────────────────────────────────────────────────────────
  LOG_CATEGORIES: [
    'profanity',             // Casual swearing (allowed in most contexts)
    'controversial_opinion', // Political speech (protected)
    'mild_suggestive',       // Borderline content
  ],

  // ─────────────────────────────────────────────────────────────────────────────
  // File restrictions
  // ─────────────────────────────────────────────────────────────────────────────
  FILE_POLICY: {
    maxSizeBytes: 50 * 1024 * 1024, // 50MB (matches existing MAX_BYTES)
    
    allowedMimeTypes: [
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/markdown',
      'text/csv',
      // Video (limited)
      'video/mp4',
      'video/webm',
      // Audio
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      // Archives (require virus scan)
      'application/zip',
      'application/x-rar-compressed',
    ],

    blockedExtensions: [
      // Executables - NEVER allow
      '.exe', '.bat', '.cmd', '.com', '.msi',
      // Scripts - dangerous
      '.sh', '.ps1', '.vbs', '.js', '.jar',
      // System files
      '.dll', '.sys', '.drv',
      // Shortcuts (can be malicious)
      '.lnk', '.scf', '.url',
    ],

    // Max dimensions for images (prevent resource exhaustion)
    maxImageDimensions: {
      width: 8192,
      height: 8192,
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Rate limits for content creation (per user per hour)
  // ─────────────────────────────────────────────────────────────────────────────
  RATE_LIMITS: {
    tasks: 100,
    comments: 200,
    uploads: 50,
    projects: 10,
    reports: 20,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // User-facing messages
  // ─────────────────────────────────────────────────────────────────────────────
  MESSAGES: {
    blocked: 'Your content could not be posted as it violates our community guidelines.',
    review: 'Your content has been submitted for review and will be visible once approved.',
    fileBlocked: 'This file type is not allowed for security reasons.',
    fileTooLarge: 'File exceeds the maximum allowed size.',
    rateLimited: 'You\'re doing that too fast. Please wait a moment.',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if a category should result in immediate block
 */
export function shouldBlock(category: string): boolean {
  return CONTENT_POLICY.BLOCK_CATEGORIES.includes(category.toLowerCase());
}

/**
 * Check if a category should be sent to review queue
 */
export function shouldReview(category: string): boolean {
  return CONTENT_POLICY.WARN_CATEGORIES.includes(category.toLowerCase());
}

/**
 * Check if a category should be logged (but allowed)
 */
export function shouldLog(category: string): boolean {
  return CONTENT_POLICY.LOG_CATEGORIES.includes(category.toLowerCase());
}

/**
 * Get the highest severity action for multiple categories
 */
export function getHighestSeverity(categories: string[]): 'BLOCK' | 'REVIEW' | 'LOG' | 'ALLOW' {
  for (const cat of categories) {
    if (shouldBlock(cat)) return 'BLOCK';
  }
  for (const cat of categories) {
    if (shouldReview(cat)) return 'REVIEW';
  }
  for (const cat of categories) {
    if (shouldLog(cat)) return 'LOG';
  }
  return 'ALLOW';
}

/**
 * Check if file extension is blocked
 */
export function isBlockedExtension(ext: string): boolean {
  const normalized = ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`;
  return CONTENT_POLICY.FILE_POLICY.blockedExtensions.includes(normalized);
}

/**
 * Check if MIME type is allowed
 */
export function isAllowedMimeType(mime: string): boolean {
  return CONTENT_POLICY.FILE_POLICY.allowedMimeTypes.includes(mime.toLowerCase());
}
