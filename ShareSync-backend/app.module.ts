import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './src/users/users.module';
import { AuthModule } from './src/auth/auth.module';
import { NotificationsModule } from './src/notifications/notifications.module';
import { PointsModule } from './src/points/points.module';
import { ProjectsModule } from './src/projects/projects.module';
import { PostsModule } from './src/posts/posts.module';
import { AppGateway } from './src/app.gateway';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/sharesync'),
    UsersModule,
    AuthModule,
    NotificationsModule,
    PointsModule,
    ProjectsModule,
    PostsModule,
  ],
  providers: [AppGateway],
})
export class AppModule {}