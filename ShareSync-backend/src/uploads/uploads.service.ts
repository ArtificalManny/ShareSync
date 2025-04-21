import { Injectable } from '@nestjs/common';
import { Express } from 'express'; // Import Express types

@Injectable()
export class UploadsService {
  async uploadFile(file: Express.Multer.File): Promise<{ url: string }> {
    return { url: `/uploads/${file.filename}` };
  }
}