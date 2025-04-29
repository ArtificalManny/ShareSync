import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../schemas/user.schema';
import { UserService } from './user.service'; // Fix: UsersService -> UserService
import { UserController } from './user.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [UserService], // Fix: UsersService -> UserService
  controllers: [UserController],
  exports: [UserService], // Fix: UsersService -> UserService
})
export class UserModule {}