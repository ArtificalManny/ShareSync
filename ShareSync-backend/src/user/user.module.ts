// src/user/user.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from './user.schema';
import { UserService } from './user.service';
import { UserController } from './user.controller';

import { ProjectModule } from '../projects/project.module';
import { ActivitiesModule } from '../activities/activities.module';
import { RealtimeModule } from '../realtime/realtime.module'; // if you inject a gateway from here

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    // If UserService injects ProjectsService, we keep forwardRef:
    forwardRef(() => ProjectModule),
    // 👇 This is the missing import so ActivitiesService is visible in UserModule
    ActivitiesModule,
    // If UserController or UserService injects RealtimeGateway:
    RealtimeModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}