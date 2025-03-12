import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../src/models/user.model'; // Adjusted path
import { AuthController } from '../src/modules/Users/auth/auth.controller'; // Adjusted path
import { AuthService } from '../src/modules/Users/auth/auth.service'; // Adjusted path

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class UserModule {}