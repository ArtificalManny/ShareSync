import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { NotificationsModule } from '../notifications/notifications.module'; // Import NotificationsModule
import { PointsModule } from '../points/points.module'; // Import PointsModule

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    NotificationsModule, // Add NotificationsModule to provide NotificationsService
    PointsModule, // Add PointsModule to provide PointsService
  ],
  controllers: [AuthController],
  providers: [AuthService, UsersService],
})
export class AuthModule {}