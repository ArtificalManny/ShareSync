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

  @UseGuards(JwtAuthGuard)
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
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new Error('Only image files are allowed'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    }),
  )
  async uploadProfilePicture(
    @UploadedFile() file: Express.Multer.File, 
    @Req() req: any
  ): Promise<{ user: any }> {
    console.log('[UPLOAD] req.user:', req.user);

    const userId = req.user.userId || req.user.sub || req.user.id;
    const user = await this.service.updateProfilePicture(userId, file.filename);

    return {
      user: {
        ...(user.toObject?.() || user),
        profilePicture: `uploads/${file.filename}`,
      },
    };
  }
}
