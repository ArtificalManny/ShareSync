import { Injectable } from '@nestjs/common';
import multer from 'multer'; // Default import

@Injectable()
export class UploadsService {
  private storage = multer.diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  });

  upload = multer({ storage: this.storage });
}