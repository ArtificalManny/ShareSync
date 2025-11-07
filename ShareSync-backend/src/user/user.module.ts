// backend/src/user/user.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UserService } from './user.service';
import { ActivitiesModule } from '../activities/activities.module';
import { ProjectModule } from '../projects/project.module';   // ← NEW

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ActivitiesModule,
    forwardRef(() => ProjectModule),   // ← NEW (breaks circular ref)
  ],
  providers: [UserService],
  exports: [UserService, MongooseModule],
})
export class UserModule {}