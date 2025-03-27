import { Injectable } from '@nestjs/common';
import { Multer } from 'multer';

@Injectable()
export class UploadsService {
  async uploadFile(file: Express.Multer.File) {
    return { url: `http://localhost:3000/uploads/${file.filename}` };
  }
}