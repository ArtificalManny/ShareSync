import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PointsService } from './points.service';
import { PointsController } from './points.controller';
import { Point, PointSchema } from './schemas/point.schema';
import { UsersService } from '../users/users.service';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Point.name, schema: PointSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [PointsController],
  providers: [PointsService, UsersService],
  exports: [PointsService],
})
export class PointsModule {}