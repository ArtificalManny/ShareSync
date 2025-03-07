import { Controller } from '@nestjs/common';
import { UploadService } from './uploads.service';

@Controller('upload')
export class UploadsController {
  constructor(private readonly uploadService: UploadService) {}
}