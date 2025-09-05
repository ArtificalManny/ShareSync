import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotifyService } from './notify.service';
import { RealtimeModule } from '../realtime/realtime.module';
import { ProjectModule } from '../projects/project.module';
import { User, UserSchema } from '../user/user.schema';

@Module({
  imports: [
    // ✅ This is the crucial bit so @InjectModel(User.name) resolves
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    forwardRef(() => RealtimeModule),
    forwardRef(() => ProjectModule),
  ],
  providers: [NotifyService],
  exports: [NotifyService],
})
export class NotifyModule {}
