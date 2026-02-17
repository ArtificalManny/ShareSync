// src/user/user.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User, UserSchema } from './schemas/user.schema';

import { ProjectsModule } from '../projects/projects.module';
import { ActivitiesModule } from '../activities/activities.module';

// ✅ Needed because UserController injects RealtimeGateway
import { RealtimeModule } from '../realtime/realtime.module';

// ✅ Likely needed because UserController injects UploadsService + ProjectFollowService
// (If either of these modules does not exist in your repo, delete that import line and we’ll adapt.)
import { UploadsModule } from '../uploads/uploads.module';
import { ProjectFollowModule } from '../follows/project-follow.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),

    // Keep existing dependencies
    forwardRef(() => ProjectsModule),
    forwardRef(() => ActivitiesModule),

    // ✅ Add realtime so RealtimeGateway is available
    forwardRef(() => RealtimeModule),

    // ✅ Add these so UploadsService + ProjectFollowService are available
    forwardRef(() => UploadsModule),
    forwardRef(() => ProjectFollowModule),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
