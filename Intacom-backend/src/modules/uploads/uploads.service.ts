import { Injectable } from '@nestjs/common';

@Injectable()
export class UploadsService {
  async uploadFile(file: Express.Multer.File): Promise<string> {
    // In a real app, you might upload to a cloud service like AWS S3
    // For now, return the local file path
    return `http://localhost:3000/uploads/${file.filename}`;
  }
}