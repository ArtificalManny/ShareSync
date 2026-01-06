// src/user/user.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from './schemas/user.schema';

import { UserService } from './user.service';
import { UserController } from './user.controller';

import { ProjectModule } from '../projects/project.module';
import { ActivitiesModule } from '../activities/activities.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    // Only register the User model here
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),

    // Other feature modules
    forwardRef(() => ProjectModule),
    ActivitiesModule,
    forwardRef(() => RealtimeModule),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [
    UserService,
    MongooseModule,
  ],
})
export class UserModule {}
