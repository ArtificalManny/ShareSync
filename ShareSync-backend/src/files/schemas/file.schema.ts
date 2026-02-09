// src/files/schemas/file.schema.ts
// ═══════════════════════════════════════════════════════════════════════════════
// FILE SCHEMA: Asset management for the Vault
// Spec-compatible additions:
// - type: 'file' | 'folder' (folder support)
// - folderId references File (self-referential)
// - version (alias for currentVersion)
// - versions: FileVersion[]
// - linkedTaskId
// Keeps advanced fields already used in the app: status, storageKey, metadata, counters, etc.
// ═══════════════════════════════════════════════════════════════════════════════

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

// ═══════════════════════════════════════════════════════════════════════════════
// ENUMS (kept for richer classification)
// ═══════════════════════════════════════════════════════════════════════════════

export enum FileKind {
  FILE = 'file',
  FOLDER = 'folder',
}

export enum FileType {
  DOCUMENT = 'document',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  ARCHIVE = 'archive',
  CODE = 'code',
  SPREADSHEET = 'spreadsheet',
  PRESENTATION = 'presentation',
  PDF = 'pdf',
  OTHER = 'other',
}

export enum FileStatus {
  UPLOADING = 'uploading',
  PROCESSING = 'processing',
  READY = 'ready',
  ERROR = 'error',
  DELETED = 'deleted',
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

@Schema({ _id: false })
export class FileVersion {
  @Prop({ required: true })
  version: number;

  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  size: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  uploadedBy: Types.ObjectId;

  // Spec wants required; we default it for convenience
  @Prop({ type: Date, default: Date.now })
  uploadedAt: Date;

  @Prop()
  changelog?: string;
}

@Schema({ _id: false })
export class FileMetadata {
  @Prop()
  width?: number;

  @Prop()
  height?: number;

  @Prop()
  duration?: number; // audio/video seconds

  @Prop()
  pages?: number; // documents/PDF

  @Prop()
  encoding?: string;

  @Prop({ type: Object })
  exif?: Record<string, any>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════

export type FileDocument = File & Document;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_: any, ret: any) => {
      ret.id = ret._id?.toString?.() ?? String(ret._id);
      delete ret.__v;
      return ret;
    },
  },
})
export class File {
  // ─────────────────────────────────────────────────────────────────────────────
  // REQUIRED RELATIONSHIPS
  // ─────────────────────────────────────────────────────────────────────────────

  @ApiProperty({ description: 'Project ID' })
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId: Types.ObjectId;

  /**
   * Spec: folderId references File (self-referential)
   * - For root items, folderId is null/undefined
   */
  @ApiProperty({ description: 'Parent folder File ID (self reference)' })
  @Prop({ type: Types.ObjectId, ref: 'File', index: true, default: null })
  folderId?: Types.ObjectId | null;

  // ─────────────────────────────────────────────────────────────────────────────
  // NAME + DESCRIPTION
  // ─────────────────────────────────────────────────────────────────────────────

  @ApiProperty({ description: 'Display name' })
  @Prop({ required: true, trim: true, maxlength: 255 })
  name: string;

  /**
   * Keep originalName for real file uploads.
   * For folders, we can just set originalName=name in service layer.
   */
  @ApiProperty({ description: 'Original filename' })
  @Prop({ trim: true, maxlength: 255, default: '' })
  originalName: string;

  @ApiProperty({ description: 'File/folder description' })
  @Prop({ maxlength: 1000, default: '' })
  description?: string;

  // ─────────────────────────────────────────────────────────────────────────────
  // SPEC FIELD: type = file|folder
  // ─────────────────────────────────────────────────────────────────────────────

  @ApiProperty({ description: "Spec kind: 'file' | 'folder'", enum: FileKind })
  @Prop({ type: String, enum: FileKind, default: FileKind.FILE, index: true })
  type: FileKind;

  /**
   * Keep richer classification in addition to type.
   * For folders this can be OTHER or omitted.
   */
  @ApiProperty({ enum: FileType })
  @Prop({ type: String, enum: FileType, default: FileType.OTHER, index: true })
  fileType: FileType;

  // ─────────────────────────────────────────────────────────────────────────────
  // MIME + SIZE + URLS
  // ─────────────────────────────────────────────────────────────────────────────

  @ApiProperty({ description: 'MIME type' })
  @Prop({ trim: true, default: '' })
  mimeType: string;

  @ApiProperty({ description: 'File extension' })
  @Prop({ trim: true })
  extension?: string;

  @ApiProperty({ description: 'File size in bytes' })
  @Prop({ type: Number, default: 0 })
  size: number;

  @ApiProperty({ description: 'Storage URL' })
  @Prop({ trim: true, default: '' })
  url: string;

  @ApiProperty({ description: 'Thumbnail URL' })
  @Prop({ trim: true, default: '' })
  thumbnailUrl?: string;

  // ─────────────────────────────────────────────────────────────────────────────
  // STORAGE INTERNALS (keep)
  // ─────────────────────────────────────────────────────────────────────────────

  @ApiProperty({ description: 'Storage key/path' })
  @Prop({ trim: true, default: '' })
  storageKey: string;

  @ApiProperty({ description: 'Storage provider' })
  @Prop({ default: 'local' })
  storageProvider: string;

  // ─────────────────────────────────────────────────────────────────────────────
  // STATUS (keep)
  // ─────────────────────────────────────────────────────────────────────────────

  @ApiProperty({ enum: FileStatus })
  @Prop({ type: String, enum: FileStatus, default: FileStatus.READY })
  status: FileStatus;

  @ApiProperty({ description: 'Error message if status is error' })
  @Prop({ trim: true })
  errorMessage?: string;

  // ─────────────────────────────────────────────────────────────────────────────
  // OWNERSHIP
  // ─────────────────────────────────────────────────────────────────────────────

  @ApiProperty({ description: 'Uploader ID' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  uploadedBy: Types.ObjectId;

  // ─────────────────────────────────────────────────────────────────────────────
  // VERSIONING (spec-compatible)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Spec wants: version
   * We store "version" and keep "currentVersion" as a compatibility alias.
   */
  @ApiProperty({ description: 'Current version number (spec)' })
  @Prop({ type: Number, default: 1 })
  version: number;

  @ApiProperty({ description: 'Current version number (legacy)' })
  @Prop({ type: Number, default: 1 })
  currentVersion: number;

  @ApiProperty({ description: 'Version history' })
  @Prop({ type: [FileVersion], default: [] })
  versions: FileVersion[];

  // ─────────────────────────────────────────────────────────────────────────────
  // METADATA (keep)
  // ─────────────────────────────────────────────────────────────────────────────

  @ApiProperty({ description: 'File metadata' })
  @Prop({ type: FileMetadata })
  metadata?: FileMetadata;

  // ─────────────────────────────────────────────────────────────────────────────
  // LINKED ENTITIES
  // ─────────────────────────────────────────────────────────────────────────────

  @ApiProperty({ description: 'Linked task ID' })
  @Prop({ type: Types.ObjectId, ref: 'Task', index: true })
  linkedTaskId?: Types.ObjectId;

  @ApiProperty({ description: 'Linked message ID' })
  @Prop({ type: Types.ObjectId, ref: 'Message' })
  linkedMessageId?: Types.ObjectId;

  // ─────────────────────────────────────────────────────────────────────────────
  // USER ACTIONS
  // ─────────────────────────────────────────────────────────────────────────────

  @ApiProperty({ description: 'Is starred/favorited' })
  @Prop({ type: Boolean, default: false })
  isStarred: boolean;

  @ApiProperty({ description: 'Users who starred this file' })
  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  starredBy: Types.ObjectId[];

  @ApiProperty({ description: 'Is archived' })
  @Prop({ type: Boolean, default: false, index: true })
  isArchived: boolean;

  @ApiProperty({ description: 'Download count' })
  @Prop({ type: Number, default: 0 })
  downloadCount: number;

  @ApiProperty({ description: 'View count' })
  @Prop({ type: Number, default: 0 })
  viewCount: number;

  // ─────────────────────────────────────────────────────────────────────────────
  // TAGS
  // ─────────────────────────────────────────────────────────────────────────────

  @ApiProperty({ description: 'File tags' })
  @Prop({ type: [String], default: [] })
  tags: string[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export const FileSchema = SchemaFactory.createForClass(File);

// ═══════════════════════════════════════════════════════════════════════════════
// INDEXES (spec + your existing needs)
// ═══════════════════════════════════════════════════════════════════════════════

FileSchema.index({ projectId: 1, folderId: 1 });
FileSchema.index({ projectId: 1, type: 1 });
FileSchema.index({ uploadedBy: 1 });

FileSchema.index({ projectId: 1, folderId: 1, isArchived: 1 });
FileSchema.index({ projectId: 1, tags: 1 });
FileSchema.index({ name: 'text', description: 'text', tags: 'text' });

// ═══════════════════════════════════════════════════════════════════════════════
// VIRTUALS
// ═══════════════════════════════════════════════════════════════════════════════

FileSchema.virtual('sizeFormatted').get(function () {
  const bytes = this.size || 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
});

FileSchema.virtual('hasVersions').get(function () {
  return (this.versions?.length ?? 0) > 1;
});

// ═══════════════════════════════════════════════════════════════════════════════
// HOOKS: keep version fields in sync
// ═══════════════════════════════════════════════════════════════════════════════

FileSchema.pre('save', function (next) {
  const doc = this as any;

  // Keep both fields aligned to avoid confusion across services/controllers
  if (typeof doc.version === 'number' && typeof doc.currentVersion !== 'number') {
    doc.currentVersion = doc.version;
  }
  if (typeof doc.currentVersion === 'number' && typeof doc.version !== 'number') {
    doc.version = doc.currentVersion;
  }
  // If both exist but differ, trust "version"
  if (typeof doc.version === 'number' && typeof doc.currentVersion === 'number' && doc.version !== doc.currentVersion) {
    doc.currentVersion = doc.version;
  }

  // Folder items should have no url/size/mime by default (safe defaults)
  if (doc.type === FileKind.FOLDER) {
    doc.size = doc.size || 0;
    doc.url = doc.url || '';
    doc.thumbnailUrl = doc.thumbnailUrl || '';
    doc.mimeType = doc.mimeType || '';
    doc.extension = doc.extension || '';
  }

  next();
});
