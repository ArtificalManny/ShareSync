// src/user/user.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UserController } from './user.controller';
import { UserService } from './user.service';

// Your existing User schema import (adjust path if different)
import { Schema } from 'mongoose';
const UserSchema = new Schema(
  {
    email: String,
    firstName: String,
    lastName: String,
    username: String,
    profilePicture: String,
    lastLogin: Date,
  },
  { timestamps: true }
);

// Import ProjectModule so UserService can receive ProjectService
import { ProjectModule } from '../projects/project.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    forwardRef(() => ProjectModule), // ← add this
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
