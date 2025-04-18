import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import * as rateLimit from 'express-rate-limit';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { PostsModule } from './posts/posts.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CommentsModule } from './comments/comments.module';
import { IdeasModule } from './ideas/ideas.module';
import { FeedbackModule } from './feedback/feedback.module';
import { LoggingModule } from './logging/logging.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI),
    AuthModule,
    UsersModule,
    ProjectsModule,
    PostsModule,
    NotificationsModule,
    CommentsModule,
    IdeasModule,
    FeedbackModule,
    LoggingModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(rateLimit.default({
        windowMs: 15 * 60 * 1000,
        max: 100,
      }))
      .forRoutes('*');
  }
}