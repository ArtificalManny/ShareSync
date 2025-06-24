// src/profile/profile.controller.ts

import {
    Controller,
    Post,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Req,
    BadRequestException,
  } from '@nestjs/common';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { diskStorage } from 'multer';
  import { extname } from 'path';
  import { JwtAuthGuard } from '../auth/jwt-auth.guard';
  import { UserService } from '../user/user.service';
  import { Request } from 'express';
  
  @Controller('profile')
  export class ProfileController {
    constructor(private readonly userService: UserService) {}
  
    @UseGuards(JwtAuthGuard)
    @Post('upload-profile-picture')
    @UseInterceptors(
      FileInterceptor('profilePicture', {
        storage: diskStorage({
          destination: './uploads/profile-pictures',
          filename: (_req, file, cb) => {
            const base = file.originalname.replace(/\.[^/.]+$/, '');
            const fileExt = extname(file.originalname);
            const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, `${base}-${unique}${fileExt}`);
          },
        }),
        fileFilter: (_req, file, cb) => {
          if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
            return cb(new BadRequestException('Only JPG/PNG allowed'), false);
          }
          cb(null, true);
        },
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      }),
    )
    async uploadProfilePicture(
      @UploadedFile() file: Express.Multer.File,
      @Req() req: Request,
    ) {
      // ← added for debugging:
      console.log(
        '🚀 uploadProfilePicture called; user:', 
        (req.user as any).sub, 
        'file:', 
        file,
      );
  
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }
  
      // extract userId from the validated JWT
      const userId = (req.user as any).sub as string;
  
      // build a URL for your front-end
      const url = `/uploads/profile-pictures/${file.filename}`;
  
      // persist it on the user record
      const updated = await this.userService.update(userId, {
        profilePicture: url,
      });
  
      return { user: updated };
    }
  }
  