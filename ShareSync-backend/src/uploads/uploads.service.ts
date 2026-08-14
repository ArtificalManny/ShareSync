// src/uploads/uploads.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// UPLOADS SERVICE - Persistent file storage
// Uses Cloudflare R2 in production when configured, with local disk fallback.
// ═══════════════════════════════════════════════════════════════════════════════

import { Injectable } from '@nestjs/common';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
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

export interface StoredObjectReference {
  url?: string | null;
  storageKey?: string | null;
  storageProvider?: string | null;
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

  private resolveR2KeyFromUrl(rawUrl: string): string | null {
    const raw = String(rawUrl || '').trim();

    if (!raw || !R2_PUBLIC_BASE_URL) {
      return null;
    }

    const base = `${trimSlash(R2_PUBLIC_BASE_URL)}/`;

    if (!raw.startsWith(base)) {
      return null;
    }

    const key = raw
      .slice(base.length)
      .split(/[?#]/, 1)[0]
      .replace(/^\/+/, '');

    return key || null;
  }

  private resolveLocalKeyFromUrl(rawUrl: string): string | null {
    const raw = String(rawUrl || '').trim();

    if (!raw) {
      return null;
    }

    if (raw.startsWith('uploads/')) {
      return raw.slice('uploads/'.length).split(/[?#]/, 1)[0] || null;
    }

    if (raw.startsWith('/uploads/')) {
      return raw.slice('/uploads/'.length).split(/[?#]/, 1)[0] || null;
    }

    if (!/^https?:\/\//i.test(raw)) {
      return null;
    }

    try {
      const candidate = new URL(raw);
      const backendBase = new URL(UPLOADS_BASE_URL);

      if (candidate.origin !== backendBase.origin) {
        return null;
      }

      if (!candidate.pathname.startsWith('/uploads/')) {
        return null;
      }

      return decodeURIComponent(
        candidate.pathname.slice('/uploads/'.length),
      ) || null;
    } catch {
      return null;
    }
  }

  private async deleteR2Key(key: string): Promise<void> {
    const normalizedKey = String(key || '')
      .trim()
      .replace(/^\/+/, '');

    if (!normalizedKey) {
      return;
    }

    if (!R2_ENABLED) {
      throw new Error(
        `Cannot delete remote upload "${normalizedKey}" because R2 is not configured`,
      );
    }

    await getR2Client().send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET,
        Key: normalizedKey,
      }),
    );
  }

  private async deleteLocalKey(key: string): Promise<void> {
    let normalizedKey = String(key || '')
      .trim()
      .replace(/\\/g, '/')
      .replace(/^\/+/, '');

    if (normalizedKey.startsWith('uploads/')) {
      normalizedKey = normalizedKey.slice('uploads/'.length);
    }

    if (!normalizedKey) {
      return;
    }

    const root = path.resolve(UPLOADS_DIR);
    const absolutePath = path.resolve(root, normalizedKey);

    if (
      absolutePath === root ||
      !absolutePath.startsWith(`${root}${path.sep}`)
    ) {
      throw new Error(`Refusing unsafe upload deletion path: ${key}`);
    }

    try {
      await fs.promises.unlink(absolutePath);
    } catch (err: any) {
      // Idempotent deletion: an already-absent object is already clean.
      if (err?.code === 'ENOENT') {
        return;
      }

      throw err;
    }
  }

  async deleteStoredObject(
    input: string | StoredObjectReference,
  ): Promise<void> {
    const reference: StoredObjectReference =
      typeof input === 'string'
        ? { url: input }
        : input || {};

    const url = String(reference.url || '').trim();
    const storageKey = String(reference.storageKey || '').trim();
    const storageProvider = String(reference.storageProvider || '')
      .trim()
      .toLowerCase();

    // Explicit remote metadata wins when available.
    if (
      (storageProvider === 'r2' || storageProvider === 's3') &&
      storageKey
    ) {
      await this.deleteR2Key(storageKey);
      return;
    }

    // UploadsService R2 objects can always be recovered from their public URL.
    const r2Key = this.resolveR2KeyFromUrl(url);

    if (r2Key) {
      await this.deleteR2Key(r2Key);
      return;
    }

    // Canonical local File metadata stores paths relative to /uploads.
    if (storageProvider === 'local' && storageKey) {
      await this.deleteLocalKey(storageKey);
      return;
    }

    const localKey = this.resolveLocalKeyFromUrl(url);

    if (localKey) {
      await this.deleteLocalKey(localKey);
      return;
    }

    // A URL that still looks like one of our uploads must not silently survive
    // because configuration changed or the provider could not be resolved.
    if (
      url.startsWith('uploads/') ||
      url.startsWith('/uploads/') ||
      url.includes('/uploads/')
    ) {
      throw new Error(
        `Could not resolve managed upload for deletion: ${url}`,
      );
    }

    // External URLs (Google avatars, remote images, etc.) are not OpenShare
    // storage objects and must not be deleted.
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
