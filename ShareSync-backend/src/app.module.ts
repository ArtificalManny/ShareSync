import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PointsModule } from './points/points.module';
import { ProjectsModule } from './projects/projects.module';
import { AppGateway } from './app.gateway';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/sharesync'),
    UsersModule,
    AuthModule,
    NotificationsModule,
    PointsModule,
    ProjectsModule,
  ],
  providers: [AppGateway],
})
export class AppModule {}