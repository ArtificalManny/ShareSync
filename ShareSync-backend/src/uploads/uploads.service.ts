// src/uploads/uploads.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// UPLOADS SERVICE - Persistent file storage
// Uses Cloudflare R2 in production when configured, with local disk fallback.
// ═══════════════════════════════════════════════════════════════════════════════

import { Injectable } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
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

function trimSlash(value: string): string {
  return String(value || '').trim().replace(/\/$/, '');
}

function normalizeUploadsBaseUrl(value?: string): string {
  const fallback =
    process.env.NODE_ENV === 'production'
      ? 'https://openshare-backend.onrender.com'
      : 'http://localhost:5050';

  const raw = trimSlash(value || fallback);

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

const UPLOADS_DIR = path.resolve(__dirname, '..', '..', 'uploads');

const R2_BUCKET = process.env.R2_BUCKET || '';
const R2_ENDPOINT = process.env.R2_ENDPOINT || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_PUBLIC_BASE_URL = trimSlash(process.env.R2_PUBLIC_BASE_URL || '');

const R2_ENABLED = Boolean(
  R2_BUCKET &&
    R2_ENDPOINT &&
    R2_ACCESS_KEY_ID &&
    R2_SECRET_ACCESS_KEY &&
    R2_PUBLIC_BASE_URL,
);

let r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!r2Client) {
    r2Client = new S3Client({
      region: 'auto',
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }

  return r2Client;
}

function getExtension(file: Express.Multer.File): string {
  if (file.originalname) {
    const ext = path.extname(file.originalname);
    if (ext) return ext;
  }

  if ((file as any).filename) {
    const ext = path.extname((file as any).filename);
    if (ext) return ext;
  }

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

  return mimeMap[file.mimetype || ''] || '';
}

function getLocalSourcePath(file: Express.Multer.File): string | null {
  const directPath = (file as any).path;
  if (directPath && fs.existsSync(directPath)) return directPath;

  const filename = (file as any).filename;
  if (filename) {
    const candidate = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(candidate)) return candidate;
  }

  return null;
}

@Injectable()
export class UploadsService {
  constructor() {
    try {
      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      }
    } catch (err) {
      console.error('Failed to create uploads directory:', err);
    }

    if (R2_ENABLED) {
      console.log(`✅ R2 uploads enabled for bucket: ${R2_BUCKET}`);
    } else {
      console.warn('⚠️ R2 uploads are not fully configured. Falling back to local disk uploads.');
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<StoredFile> {
    if (!file) {
      throw new Error('No file provided');
    }

    const id = crypto.randomUUID();
    const ext = getExtension(file);
    const filename = `${id}${ext}`;
    const mime = file.mimetype || 'application/octet-stream';
    const size = Number(file.size || 0);

    if (R2_ENABLED) {
      const key = `uploads/${filename}`;
      const localPath = getLocalSourcePath(file);

      let body: Buffer | fs.ReadStream;

      if (file.buffer) {
        body = file.buffer;
      } else if (localPath) {
        body = fs.createReadStream(localPath);
      } else {
        throw new Error('No file data available for R2 upload');
      }

      await getR2Client().send(
        new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: key,
          Body: body,
          ContentType: mime,
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );

      if (localPath) {
        try {
          fs.unlinkSync(localPath);
        } catch {
          // Non-blocking cleanup.
        }
      }

      const url = `${R2_PUBLIC_BASE_URL}/${key}`;

      return {
        id,
        url,
        thumbUrl: mime.startsWith('image/') ? url : undefined,
        name: file.originalname || filename,
        size,
        mime,
      };
    }

    let localFilename: string;

    if ((file as any).filename) {
      localFilename = path.basename((file as any).filename);
    } else if (file.buffer) {
      localFilename = filename;
      const destPath = path.join(UPLOADS_DIR, localFilename);
      fs.writeFileSync(destPath, file.buffer);
    } else {
      throw new Error('No file data available — neither filename nor buffer present');
    }

    const relativePath = `/uploads/${localFilename}`;
    const url = `${UPLOADS_BASE_URL}${relativePath}`;

    return {
      id,
      url,
      thumbUrl: mime.startsWith('image/') ? url : undefined,
      name: file.originalname || localFilename,
      size,
      mime,
    };
  }

  async uploadAvatar(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new Error('No avatar file provided');
    }

    const stored = await this.uploadFile(file);
    return stored.url;
  }
}
