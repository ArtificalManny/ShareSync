import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { AuthModule } from './auth/auth.module';
import { UploadsModule } from './uploads/uploads.module';
import { ActivitiesModule } from './activities/activities.module';
import { PostsModule } from './posts/posts.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PointsModule } from './points/points.module';
import { FeedbackModule } from './feedback/feedback.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: () => {
        console.log('MONGODB_URI in AppModule:', process.env.MONGODB_URI);
        if (!process.env.MONGODB_URI) {
          throw new Error('MONGODB_URI is not defined in the environment variables');
        }
        return {
          uri: process.env.MONGODB_URI,
          serverSelectionTimeoutMS: 60000, // 60 seconds timeout
        };
      },
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    UsersModule,
    ProjectsModule,
    AuthModule,
    UploadsModule,
    ActivitiesModule,
    PostsModule,
    NotificationsModule,
    PointsModule,
    FeedbackModule,
    TasksModule,
  ],
})
export class AppModule {}