// src/profile/profile.controller.ts
import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
} from '@nestjs/common';
import { FileInterceptor }   from '@nestjs/platform-express';
import { JwtAuthGuard }     from '../auth/jwt-auth.guard';
import { ProfileService }   from './profile.service';

@Controller('profile')
export class ProfileController {
  constructor(private readonly service: ProfileService) {}

  @UseGuards(JwtAuthGuard)
  @Post('upload-profile-picture')
  @UseInterceptors(FileInterceptor('profilePicture'))
  async uploadProfilePicture(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    const user = await this.service.updateProfilePicture(
      req.user.userId,
      file,
    );
    return { user };
  }
}
