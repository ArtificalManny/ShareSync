import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PointsModule } from './points/points.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGODB_URI,
      }),
    }),
    AuthModule,
    UsersModule,
    PointsModule,
    NotificationsModule,
  ],
})
export class AppModule {}