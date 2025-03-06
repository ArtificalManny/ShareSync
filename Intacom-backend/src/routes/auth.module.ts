import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../../../models/user.model'; // Updated path
import { AuthController } from '../modules/Users/auth/auth.controller'; // Updated path
import { AuthService } from '../modules/Users/auth/auth.service'; // Updated path

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}