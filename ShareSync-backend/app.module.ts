import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { NotificationSchema } from './notification.schema';
import { TaskSchema } from './task.schema';
import { ResetTokenSchema } from './reset-token/reset-token.schema';
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
    ]),
    AuthModule,
    UsersModule,
  ],
  controllers: [TasksController],
  providers: [NotificationsGateway, NotificationsService, TasksService, ResetTokenService],
})
export class AppModule {}