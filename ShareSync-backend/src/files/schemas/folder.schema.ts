// src/files/schemas/folder.schema.ts
// ═══════════════════════════════════════════════════════════════════════════════
// FOLDER SCHEMA: Directory structure for the Vault
// ═══════════════════════════════════════════════════════════════════════════════

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type FolderDocument = Folder & Document;

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
export class Folder {
  @ApiProperty({ description: 'Folder name' })
  @Prop({ required: true, trim: true, maxlength: 100 })
  name: string;

  @ApiProperty({ description: 'Project ID' })
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId: Types.ObjectId;

  @ApiProperty({ description: 'Parent folder ID (null for root)' })
  @Prop({ type: Types.ObjectId, ref: 'Folder', index: true })
  parentId?: Types.ObjectId;

  @ApiProperty({ description: 'Folder path' })
  @Prop({ default: '/' })
  path: string;

  @ApiProperty({ description: 'Folder color' })
  @Prop()
  color?: string;

  @ApiProperty({ description: 'Folder icon' })
  @Prop()
  icon?: string;

  @ApiProperty({ description: 'Creator ID' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @ApiProperty({ description: 'Is archived' })
  @Prop({ type: Boolean, default: false })
  isArchived: boolean;

  // Cached counts (updated on file operations)
  @Prop({ type: Number, default: 0 })
  fileCount: number;

  @Prop({ type: Number, default: 0 })
  folderCount: number;

  @Prop({ type: Number, default: 0 })
  totalSize: number; // Total size of files in folder

  createdAt: Date;
  updatedAt: Date;
}

export const FolderSchema = SchemaFactory.createForClass(Folder);

// Indexes
FolderSchema.index({ projectId: 1, parentId: 1 });
FolderSchema.index({ projectId: 1, path: 1 });
FolderSchema.index({ projectId: 1, name: 1, parentId: 1 }, { unique: true });

// Virtual for full path
FolderSchema.virtual('fullPath').get(function () {
  return `${this.path}${this.name}/`;
});
