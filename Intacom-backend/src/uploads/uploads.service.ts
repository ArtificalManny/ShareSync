import { Injectable } from '@nestjs/common';
import { writeFile } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class UploadsService {
  async uploadFile(file: Express.Multer.File): Promise<{ url: string }> {
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = join(__dirname, '..', '..', 'uploads', fileName);
    await writeFile(filePath, file.buffer);
    const url = `/uploads/${fileName}`;
    return { url };
  }
}