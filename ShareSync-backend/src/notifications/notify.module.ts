// backend/src/notifications/notify.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { NotifyService } from './notify.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [forwardRef(() => UserModule)],
  providers: [NotifyService],
  exports: [NotifyService],
})
export class NotifyModule {}