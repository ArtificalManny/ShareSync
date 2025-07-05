// src/profile/profile.controller.ts
import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { extname } from 'path';
import { ProfileService } from './profile.service';

@Controller('profile')
export class ProfileController {
  constructor(private readonly service: ProfileService) {}

  @UseGuards(JwtAuthGuard) // ✅ This protects the route
  @Post('upload-profile-picture')
  @UseInterceptors(
    FileInterceptor('profilePicture', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const filename = `profile-${Date.now()}${extname(file.originalname)}`;
          cb(null, filename);
        },
      }),
    }),
  )
  async uploadProfilePicture(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    console.log('[UPLOAD] req.user:', req.user); // ✅ Should show decoded token
    const user = await this.service.updateProfilePicture(req.user.userId, file);
    return { user };
  }
}
