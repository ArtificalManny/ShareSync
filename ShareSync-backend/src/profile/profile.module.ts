import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ProfileController } from './profile.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    UserModule,
    MulterModule.register({ dest: './uploads/profile-pictures' }),
  ],
  controllers: [ProfileController],
})
export class ProfileModule {}
