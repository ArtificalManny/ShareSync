// src/uploads/uploads.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// UPLOADS SERVICE - File persistence to local disk
// ═══════════════════════════════════════════════════════════════════════════════

import { Injectable } from '@nestjs/common';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface StoredFile {
  id: string;
  url: string;
  thumbUrl?: string;
  name: string;
  size: number;
  mime: string;
}

// Backend base URL for constructing absolute file URLs.
// In production, never emit localhost URLs because browsers cannot load them.
function normalizeUploadsBaseUrl(value?: string): string {
  const fallback =
    process.env.NODE_ENV === 'production'
      ? 'https://openshare-backend.onrender.com'
      : 'http://localhost:5050';

  const raw = String(value || fallback).trim().replace(/\/$/, '');

  if (
    process.env.NODE_ENV === 'production' &&
    (/localhost/i.test(raw) || /127\.0\.0\.1/.test(raw))
  ) {
    return 'https://openshare-backend.onrender.com';
  }

  return raw || fallback;
}

const UPLOADS_BASE_URL = normalizeUploadsBaseUrl(
  process.env.UPLOADS_BASE_URL ||
    process.env.PUBLIC_BACKEND_URL ||
    process.env.API_PUBLIC_URL ||
    process.env.BACKEND_URL ||
    process.env.RENDER_EXTERNAL_URL,
);

// Resolve uploads directory relative to project root (where package.json lives)
// __dirname at runtime = <project>/dist/uploads
// uploads folder      = <project>/uploads
const UPLOADS_DIR = path.resolve(__dirname, '..', '..', 'uploads');

@Injectable()
export class UploadsService {
  constructor() {
    // Ensure the uploads directory exists on startup
    try {
      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      }
    } catch (err) {
      console.error('Failed to create uploads directory:', err);
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<StoredFile> {
    const id = crypto.randomUUID();

    // Determine file extension from original name or mimetype
    let ext = '';
    if (file.originalname) {
      const dotIndex = file.originalname.lastIndexOf('.');
      if (dotIndex !== -1) {
        ext = file.originalname.substring(dotIndex);
      }
    }
    if (!ext && file.mimetype) {
      const mimeMap: Record<string, string> = {
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp',
        'image/avif': '.avif',
        'image/svg+xml': '.svg',
        'application/pdf': '.pdf',
      };
      ext = mimeMap[file.mimetype] || '';
    }

    // If Multer already saved to disk (disk storage), use that filename
    // Otherwise (memory storage), write the buffer to disk ourselves
    let filename: string;

    if ((file as any).filename) {
      // Multer disk storage already wrote the file
      filename = (file as any).filename;
    } else if (file.buffer) {
      // Memory storage: write buffer to uploads directory
      filename = `${id}${ext}`;
      const destPath = path.join(UPLOADS_DIR, filename);
      fs.writeFileSync(destPath, file.buffer);
    } else {
      throw new Error('No file data available — neither filename nor buffer present');
    }

    const relativePath = `/uploads/${filename}`;
    const url = `${UPLOADS_BASE_URL}${relativePath}`;
    const thumbUrl = file.mimetype?.startsWith('image/') ? url : undefined;

    return {
      id,
      url,
      thumbUrl,
      name: file.originalname,
      size: file.size,
      mime: file.mimetype || 'application/octet-stream',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // AVATAR UPLOAD WRAPPER
  // Controller expects a string URL. We reuse uploadFile().
  // ─────────────────────────────────────────────────────────────────────────────
  async uploadAvatar(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new Error('No avatar file provided');
    }
    const stored = await this.uploadFile(file);
    return stored.url;
  }
}
