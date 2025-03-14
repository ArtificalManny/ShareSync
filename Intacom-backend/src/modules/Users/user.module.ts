import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../../models/user.model'; // Relative path
import { AuthController } from '../Users/auth/auth.controller'; // Relative path
import { AuthService } from '../Users/auth/auth.service'; // Relative path

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class UserModule {}