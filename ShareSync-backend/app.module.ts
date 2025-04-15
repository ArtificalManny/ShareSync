import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { PostsModule } from './posts/posts.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CommentsModule } from './comments/comments.module';
import { IdeasModule } from './ideas/ideas.module';
import { FeedbackModule } from './feedback/feedback.module';
import { ProjectGateway } from './gateway/project.gateway';
import { LoggingModule } from './logging/logging.module';
import * as rateLimit from 'express-rate-limit';

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
  providers: [ProjectGateway],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        rateLimit({
          windowMs: 15 * 60 * 1000, // 15 minutes
          max: 100, // Limit each IP to 100 requests per windowMs
          message: 'Too many requests from this IP, please try again later.',
        }),
      )
      .forRoutes('*');
  }
}