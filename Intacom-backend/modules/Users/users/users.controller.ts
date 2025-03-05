import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGiuard } from '../auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { disksStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req) {
    return this.usersService.getUserProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  updateProfile(@Body() updateUserDto: any, @Req() req) {
    return this.usersService.updateUserProfile(req.user.userId, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload-profile-image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/profile',
        filename: (req, file, cb) => {
          const filename = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, filename);
        },
      }),
    }),
  )
  uploadProfileImage(@UploadedFile() file, @Req() req) {
    return this.usersService.updateProfileImage(req.user.userId, file.filename);
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload-cover-image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/cover',
        filename: (req, file, cb) => {
          const filename = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, filename);
        },
      }),
    }),
  )
  uploadCoverImage(@UploadedFile() file, @Req() req) {
    return this.usersService.updateCoverImage(req.user.userId, file.filename);
  }
}
