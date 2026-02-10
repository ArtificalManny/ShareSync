// src/files/files.storage.ts
// ═══════════════════════════════════════════════════════════════════════════════
// FILE STORAGE WRAPPER
// - Designed to be safe to add WITHOUT wiring into controllers yet.
// - Supports local filesystem out of the box.
// - Includes optional S3 stub (disabled unless configured).
//
// This module is intentionally minimal so it doesn't create a quagmire.
// Wire it later when you're ready to add upload endpoints.
// ═══════════════════════════════════════════════════════════════════════════════

import * as path from 'path';
import * as crypto from 'crypto';
import { promises as fs } from 'fs';

export type StorageProvider = 'local' | 's3';

export interface StoredObject {
  provider: StorageProvider;
  storageKey: string;
  url: string;
}

export interface PutObjectInput {
  buffer: Buffer;
  originalName: string;
  mimeType?: string;
  projectId?: string;
  folderId?: string | null;
}

export interface DeleteObjectInput {
  storageKey: string;
}

export interface FilesStorage {
  putObject(input: PutObjectInput): Promise<StoredObject>;
  deleteObject(input: DeleteObjectInput): Promise<void>;
}

function safeExt(originalName: string): string {
  const ext = path.extname(originalName || '').toLowerCase();
  // keep it simple + safe
  if (!ext || ext.length > 10) return '';
  return ext.replace(/[^a-z0-9.]/g, '');
}

function randomKey(bytes = 16): string {
  return crypto.randomBytes(bytes).toString('hex');
}

function ensureTrailingSlash(p: string): string {
  return p.endsWith('/') ? p : `${p}/`;
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL STORAGE
// ─────────────────────────────────────────────────────────────────────────────

export interface LocalStorageOptions {
  /**
   * Absolute or relative directory where uploads are stored.
   * Default: <repo>/uploads
   */
  rootDir?: string;

  /**
   * Public base URL to access uploaded files (if served statically).
   * Example: http://localhost:3000/uploads
   * Default: /uploads
   */
  publicBaseUrl?: string;
}

export class LocalFilesStorage implements FilesStorage {
  private readonly rootDir: string;
  private readonly publicBaseUrl: string;

  constructor(options: LocalStorageOptions = {}) {
    this.rootDir = options.rootDir || path.resolve(process.cwd(), 'uploads');
    this.publicBaseUrl = options.publicBaseUrl || '/uploads';
  }

  async putObject(input: PutObjectInput): Promise<StoredObject> {
    const ext = safeExt(input.originalName);
    const projectPart = input.projectId ? `project_${input.projectId}` : 'project_unknown';
    const folderPart = input.folderId ? `folder_${input.folderId}` : 'root';

    const fileName = `${Date.now()}_${randomKey(10)}${ext}`;
    const relKey = path.posix.join('files', projectPart, folderPart, fileName);

    const absPath = path.resolve(this.rootDir, relKey);
    const absDir = path.dirname(absPath);

    await fs.mkdir(absDir, { recursive: true });
    await fs.writeFile(absPath, input.buffer);

    const base = ensureTrailingSlash(this.publicBaseUrl);
    const url = `${base}${relKey}`.replace(/\\/g, '/');

    return {
      provider: 'local',
      storageKey: relKey,
      url,
    };
  }

  async deleteObject(input: DeleteObjectInput): Promise<void> {
    const absPath = path.resolve(this.rootDir, input.storageKey);

    try {
      await fs.unlink(absPath);
    } catch (err: any) {
      // if it's already gone, treat as success
      if (err?.code === 'ENOENT') return;
      throw err;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// S3 STORAGE (stub - only implement when ready)
// ─────────────────────────────────────────────────────────────────────────────

export interface S3StorageOptions {
  bucket: string;
  region?: string;
  publicBaseUrl?: string; // optional CDN base
}

/**
 * NOTE:
 * We intentionally do NOT import AWS SDK here to avoid adding dependencies
 * and breaking your build.
 *
 * When you're ready:
 * - install @aws-sdk/client-s3
 * - implement putObject/deleteObject
 */
export class S3FilesStorage implements FilesStorage {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(options: S3StorageOptions) {}

  async putObject(): Promise<StoredObject> {
    throw new Error('S3FilesStorage not implemented yet. Use LocalFilesStorage for now.');
  }

  async deleteObject(): Promise<void> {
    throw new Error('S3FilesStorage not implemented yet. Use LocalFilesStorage for now.');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FACTORY
// ─────────────────────────────────────────────────────────────────────────────

export interface FilesStorageFactoryOptions {
  provider?: StorageProvider;

  local?: LocalStorageOptions;

  s3?: S3StorageOptions;
}

export function createFilesStorage(options: FilesStorageFactoryOptions = {}): FilesStorage {
  const provider: StorageProvider = options.provider || 'local';

  if (provider === 's3') {
    if (!options.s3?.bucket) {
      throw new Error('S3 storage selected but no bucket configured.');
    }
    return new S3FilesStorage(options.s3);
  }

  return new LocalFilesStorage(options.local);
}
