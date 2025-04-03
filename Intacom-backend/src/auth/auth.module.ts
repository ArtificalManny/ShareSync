import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PointsService } from '../points/points.service';
import { Notification, NotificationSchema } from '../notifications/schemas/notification.schema';
import { Point, PointSchema } from '../points/schemas/point.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Point.name, schema: PointSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, UsersService, NotificationsService, PointsService],
})
export class AuthModule {}