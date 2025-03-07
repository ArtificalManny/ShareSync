import { Controller, Get, Put, Body, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('users')
export class UsersController {
  @Get('profile')
  getProfile() {
    return { message: 'Profile endpoint' };
  }

  @Put('profile')
  updateProfile(@Body() updateUserDto: any) {
    return { message: 'Profile updated' };
  }

  @Post('profile-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/profile-images',
        filename: (req: any, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  uploadProfileImage(@UploadedFile() file: Express.Multer.File) {
    return { message: 'Profile image uploaded', filePath: file.path };
  }

  @Post('cover-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/cover-images',
        filename: (req: any, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  uploadCoverImage(@UploadedFile() file: Express.Multer.File) {
    return { message: 'Cover image uploaded', filePath: file.path };
  }
}