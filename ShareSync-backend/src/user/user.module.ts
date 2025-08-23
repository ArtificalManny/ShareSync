// src/user/user.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';              // <-- add this
import { ProjectModule } from '../projects/project.module';

import { UserController } from './user.controller';
import { UserService } from './user.service';

// If you already have a proper schema class, import that instead of inline Schema
import { Schema } from 'mongoose';
const UserSchema = new Schema({
  email: String,
  firstName: String,
  lastName: String,
  username: String,
  profilePicture: String,
  lastLogin: Date,
}, { timestamps: true });

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    forwardRef(() => AuthModule),         // <-- important
    forwardRef(() => ProjectModule),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}