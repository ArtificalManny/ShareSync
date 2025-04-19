import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { NotificationSchema } from './notifications/schemas/notification.schema';
import { TaskSchema } from './tasks/schemas/task.schema';
import { ResetTokenSchema } from './reset-token/reset-token.schema';
import { ChatMessageSchema } from './chat/chat.schema';
import { ActivitySchema } from './activities.schemas/activity.schema';
import { NotificationsGateway } from './notifications/notifications.gateway';
import { NotificationsService } from './notifications/notifications.service';
import { TasksService } from './tasks/tasks.service';
import { TasksController } from './tasks/tasks.controller';
import { ResetTokenService } from './reset-token/reset-token.service';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/intacom'),
    MongooseModule.forFeature([
      { name: 'Notification', schema: NotificationSchema },
      { name: 'Task', schema: TaskSchema },
      { name: 'ResetToken', schema: ResetTokenSchema },
      { name: 'ChatMessage', schema: ChatMessageSchema },
      { name: 'Activity', schema: ActivitySchema },
    ]),
    AuthModule,
    UsersModule,
  ],
  controllers: [TasksController],
  providers: [NotificationsGateway, NotificationsService, TasksService, ResetTokenService],
})
export class AppModule {}