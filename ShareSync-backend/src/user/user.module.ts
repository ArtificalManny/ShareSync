// src/user/user.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Schema } from 'mongoose';

import { AuthModule } from '../auth/auth.module';
import { ProjectModule } from '../projects/project.module';
import { ActivitiesModule } from '../activities/activities.module';
import { RealtimeModule } from '../realtime/realtime.module';

import { UserController } from './user.controller';
import { UserService } from './user.service';

const UserSchema = new Schema(
  {
    email: String,
    firstName: String,
    lastName: String,
    username: String,
    bio: String,
    profilePicture: String,
    publicProfile: { type: Boolean, default: true },
    lastLogin: Date,
    streakDays: Number,
  },
  { timestamps: true }
);

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    forwardRef(() => AuthModule),
    forwardRef(() => ProjectModule),
    forwardRef(() => ActivitiesModule),
    RealtimeModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}