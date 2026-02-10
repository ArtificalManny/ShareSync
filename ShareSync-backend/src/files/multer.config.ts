// src/files/multer.config.ts
// ═══════════════════════════════════════════════════════════════════════════════
// MULTER CONFIG (local uploads)
// - Safe to add without wiring into controllers.
// - Use later with @UseInterceptors(FileInterceptor(...)) etc.
// ═══════════════════════════════════════════════════════════════════════════════

import * as path from 'path';
import * as crypto from 'crypto';
import { diskStorage } from 'multer';
import type { Options as MulterOptions } from 'multer';

function safeFileName(originalName: string): string {
  const ext = path.extname(originalName || '').toLowerCase().replace(/[^a-z0-9.]/g, '');
  const base = crypto.randomBytes(16).toString('hex');
  return `${Date.now()}_${base}${ext}`;
}

export interface MulterConfigOptions {
  uploadRoot?: string; // default: <repo>/uploads
  maxFileSizeBytes?: number; // default: 25MB
}

/**
 * Default local upload destination:
 *   <repo>/uploads/tmp
 *
 * Later you can move from tmp -> final storageKey path in FilesService.
 */
export function buildMulterOptions(opts: MulterConfigOptions = {}): MulterOptions {
  const uploadRoot = opts.uploadRoot || path.resolve(process.cwd(), 'uploads');
  const tmpDir = path.resolve(uploadRoot, 'tmp');

  const maxFileSizeBytes = opts.maxFileSizeBytes ?? 25 * 1024 * 1024; // 25MB

  return {
    storage: diskStorage({
      destination: (_req, _file, cb) => cb(null, tmpDir),
      filename: (_req, file, cb) => cb(null, safeFileName(file.originalname)),
    }),
    limits: {
      fileSize: maxFileSizeBytes,
    },
  };
}
