// src/files/schemas/file.schema.ts
// ═══════════════════════════════════════════════════════════════════════════════
// FILE SCHEMA: Asset management for the Vault
// ═══════════════════════════════════════════════════════════════════════════════

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

// ═══════════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════════

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
  duration?: number; // For audio/video in seconds

  @Prop()
  pages?: number; // For documents/PDFs

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
  // BASIC INFO
  // ─────────────────────────────────────────────────────────────────────────────

  @ApiProperty({ description: 'Display name' })
  @Prop({ required: true, trim: true, maxlength: 255 })
  name: string;

  @ApiProperty({ description: 'Original filename' })
  @Prop({ required: true, maxlength: 255 })
  originalName: string;

  @ApiProperty({ description: 'File description' })
  @Prop({ maxlength: 1000 })
  description?: string;

  // ─────────────────────────────────────────────────────────────────────────────
  // ORGANIZATION
  // ─────────────────────────────────────────────────────────────────────────────

  @ApiProperty({ description: 'Project ID' })
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId: Types.ObjectId;

  @ApiProperty({ description: 'Parent folder ID' })
  @Prop({ type: Types.ObjectId, ref: 'Folder', index: true })
  folderId?: Types.ObjectId;

  // ─────────────────────────────────────────────────────────────────────────────
  // FILE INFO
  // ─────────────────────────────────────────────────────────────────────────────

  @ApiProperty({ enum: FileType })
  @Prop({ type: String, enum: FileType, required: true, index: true })
  type: FileType;

  @ApiProperty({ description: 'MIME type' })
  @Prop({ required: true })
  mimeType: string;

  @ApiProperty({ description: 'File extension' })
  @Prop()
  extension?: string;

  @ApiProperty({ description: 'File size in bytes' })
  @Prop({ type: Number, required: true })
  size: number;

  // ─────────────────────────────────────────────────────────────────────────────
  // STORAGE
  // ─────────────────────────────────────────────────────────────────────────────

  @ApiProperty({ description: 'Storage URL' })
  @Prop({ required: true })
  url: string;

  @ApiProperty({ description: 'Thumbnail URL' })
  @Prop()
  thumbnailUrl?: string;

  @ApiProperty({ description: 'Storage key/path' })
  @Prop({ required: true })
  storageKey: string;

  @ApiProperty({ description: 'Storage provider' })
  @Prop({ default: 'local' })
  storageProvider: string;

  // ─────────────────────────────────────────────────────────────────────────────
  // STATUS
  // ─────────────────────────────────────────────────────────────────────────────

  @ApiProperty({ enum: FileStatus })
  @Prop({ type: String, enum: FileStatus, default: FileStatus.READY })
  status: FileStatus;

  @ApiProperty({ description: 'Error message if status is error' })
  @Prop()
  errorMessage?: string;

  // ─────────────────────────────────────────────────────────────────────────────
  // OWNERSHIP
  // ─────────────────────────────────────────────────────────────────────────────

  @ApiProperty({ description: 'Uploader ID' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  uploadedBy: Types.ObjectId;

  // ─────────────────────────────────────────────────────────────────────────────
  // VERSIONING
  // ─────────────────────────────────────────────────────────────────────────────

  @ApiProperty({ description: 'Current version number' })
  @Prop({ type: Number, default: 1 })
  currentVersion: number;

  @ApiProperty({ description: 'Version history' })
  @Prop({ type: [FileVersion], default: [] })
  versions: FileVersion[];

  // ─────────────────────────────────────────────────────────────────────────────
  // METADATA
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
// INDEXES
// ═══════════════════════════════════════════════════════════════════════════════

FileSchema.index({ projectId: 1, folderId: 1, isArchived: 1 });
FileSchema.index({ projectId: 1, type: 1 });
FileSchema.index({ projectId: 1, tags: 1 });
FileSchema.index({ name: 'text', description: 'text', tags: 'text' });

// ═══════════════════════════════════════════════════════════════════════════════
// VIRTUALS
// ═══════════════════════════════════════════════════════════════════════════════

FileSchema.virtual('sizeFormatted').get(function () {
  const bytes = this.size;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
});

FileSchema.virtual('hasVersions').get(function () {
  return (this.versions?.length ?? 0) > 1;
});
