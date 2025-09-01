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

@Injectable()
export class UploadsService {
  async uploadFile(file: Express.Multer.File): Promise<StoredFile> {
    // TODO: your actual persistence (S3, local, etc.)
    // For now, assume the file is accessible at /uploads/<filename>
    const id = crypto.randomUUID();
    const url = `/uploads/${file.filename || id}`;
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
}