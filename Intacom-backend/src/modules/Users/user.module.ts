import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../../models/user.model'; // Adjusted path: from ../src/models to ../../models
import { AuthController } from '../Users/auth/auth.controller'; // Adjusted path
import { AuthService } from '../Users/auth/auth.service'; // Adjusted path

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class UserModule {}