import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class UploadsService {
  uploadFile(req: Request, res: Response) {
    const storage = multer.diskStorage({
      destination: './uploads/',
      filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
      }
    });
    const upload = multer({ storage }).single('file');

    upload(req, res, (err) => {
      if (err) {
        res.status(500).json({ error: 'File upload failed' });
        return;
      }
      res.json(`http://localhost:3000/uploads/${req.file.filename}`);
    });
  }
}