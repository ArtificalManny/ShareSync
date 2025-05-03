import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { writeFile } from 'fs/promises';

@Injectable()
export class UploadsService {
  async uploadFile(file: Express.Multer.File): Promise<{ url: string }> {
    const uploadPath = join(__dirname, '..', '..', 'uploads', file.originalname);
    await writeFile(uploadPath, file.buffer);
    return { url: `/uploads/${file.originalname}` };
  }
}