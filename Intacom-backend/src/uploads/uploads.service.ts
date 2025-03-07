import { Injectable } from '@nestjs/common';
import multer from 'multer';
import { S3 } from 'aws-sdk';
import { Request, Response } from 'express';

@Injectable()
export class UploadService {
  private upload = multer({ storage: multer.memoryStorage() });

  uploadFile(req: Request, res: Response) {
    this.upload.single('file')(req, res, (err: any) => {
      if (err) {
        console.error(err);
        return res.status(400).json({ error: 'Upload failed' });
      }
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const s3 = new S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        region: process.env.AWS_REGION!,
      });

      const fileName = `${Date.now()}-${file.originalname}`;
      const params = {
        Bucket: process.env.S3_BUCKET!,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      s3.upload(params, (error: Error, data: any) => {
        if (error) {
          return res.status(500).json({ error: 'Upload to S3 failed' });
        }
        res.json(data.Location);
      });
    });
  }
}