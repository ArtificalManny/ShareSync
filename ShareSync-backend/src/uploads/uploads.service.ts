import { Injectable } from '@nestjs/common';

@Injectable()
export class UploadsService {
  async uploadFile(file: Express.Multer.File): Promise<{ url: string }> {
    return { url: `/uploads/${file.filename}` };
  }
}