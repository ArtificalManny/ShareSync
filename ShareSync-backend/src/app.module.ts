import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { NotificationSchema } from './schemas/notification.schema';
import { TaskSchema } from './schemas/task.schema';
import { ResetTokenSchema } from './reset-token/reset-token.schema';
import { ChatMessageSchema } from './chat/chat.schema';
import { ActivitySchema } from './schemas/activity.schema';
import { NotificationsGateway } from './notifications/notifications.gateway';
import { NotificationsService } from './notifications/notifications.service';
import { TasksService } from './tasks/tasks.service';
import { TasksController } from './tasks/tasks.controller';
import { ResetTokenService } from './reset-token/reset-token.service';
import { CacheModule } from './cache/cache.module';
import { ActivitiesService } from './activities/activities.service';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI, {
      connectionFactory: (connection) => {
        connection.on('connected', () => {
          console.log('Successfully connected to MongoDB Atlas');
        });
        connection.on('error', (error) => {
          console.error('MongoDB connection error:', error);
        });
        return connection;
      },
    }),
    MongooseModule.forFeature([
      { name: 'Notification', schema: NotificationSchema },
      { name: 'Task', schema: TaskSchema },
      { name: 'ResetToken', schema: ResetTokenSchema },
      { name: 'ChatMessage', schema: ChatMessageSchema },
      { name: 'Activity', schema: ActivitySchema },
    ]),
    AuthModule,
    UsersModule,
    CacheModule,
  ],
  controllers: [TasksController],
  providers: [NotificationsGateway, NotificationsService, TasksService, ResetTokenService, ActivitiesService],
})
export class AppModule {
  configure(consumer) {
    consumer.apply((app) => {
      app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', 'http://localhost:54693');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        res.header('Access-Control-Allow-Credentials', 'true');
        if (req.method === 'OPTIONS') {
          res.sendStatus(200);
        } else {
          next();
        }
      });
    }).forRoutes('*');
  }
}