import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsService } from './notifications.service';
import { RealtimeModule } from '../realtime/realtime.module';
import { ProjectModule } from '../projects/project.module';

// ✅ Register the User model here so @InjectModel(User.name) resolves
import { User, UserSchema } from '../user/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    forwardRef(() => RealtimeModule),
    forwardRef(() => ProjectModule),
    // (Importing UserModule is optional now; this module has its own User provider.)
  ],
  providers: [NotificationsService],   // <- make sure this matches the class name below
  exports: [NotificationsService],
})
export class NotificationsModule {}