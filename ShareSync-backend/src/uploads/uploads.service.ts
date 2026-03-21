import { Injectable } from '@nestjs/common';
import * as crypto from 'node:crypto';

export interface StoredFile {
  id: string;
  url: string;
  thumbUrl?: string;
  name: string;
  size: number;
  mime: string;
}

// Backend base URL for constructing absolute file URLs
// In production, replace with your CDN/S3 URL via environment variable
const UPLOADS_BASE_URL = process.env.UPLOADS_BASE_URL || 'http://localhost:5050';

@Injectable()
export class UploadsService {
  async uploadFile(file: Express.Multer.File): Promise<StoredFile> {
    // TODO: your actual persistence (S3, local, etc.)
    const id = crypto.randomUUID();
    const filename = (file as any).filename || id;
    // ✅ FIX: Return absolute URL so frontend can render images directly
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
