// src/user/user.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from './schemas/user.schema'; // keep your existing path
import { UserService } from './user.service';
import { UserController } from './user.controller';

import { ProjectsModule } from '../projects/projects.module';
import { ActivitiesModule } from '../activities/activities.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    // Registers the User model in this module’s scope
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    // If UserService references ProjectService, keep forwardRef
    forwardRef(() => ProjectsModule),
    ActivitiesModule,
    RealtimeModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  // ⬅️ Export MongooseModule so other modules (like NotificationsModule) can inject UserModel
  exports: [UserService, MongooseModule],
})
export class UserModule {}