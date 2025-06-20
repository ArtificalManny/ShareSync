// src/profile/profile.module.ts
import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { UserModule } from '../user/user.module';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    UserModule,
    MulterModule.register({
      dest: './uploads/profile-pictures',
    }),
  ],
  controllers: [ProfileController],
})
export class ProfileModule {}
