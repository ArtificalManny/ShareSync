import { Controller, Post, Req, Res } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { Request, Response } from 'express';

@Controller('upload')
export class UploadsController {
  constructor(private uploadsService: UploadsService) {}

  @Post()
  async uploadFile(@Req() req: Request, @Res() res: Response) {
    await this.uploadsService.uploadFile(req, res);
  }
}