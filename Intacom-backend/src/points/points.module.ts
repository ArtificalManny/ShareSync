import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PointsService } from './points.service';
import { PointsController } from './points.controller';
import { Point, PointSchema } from './schemas/point.schema';
import { UsersModule } from '../users/users.module'; // Import UsersModule

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Point.name, schema: PointSchema },
    ]),
    UsersModule, // Import UsersModule to provide UsersService
  ],
  controllers: [PointsController],
  providers: [PointsService],
  exports: [PointsService],
})
export class PointsModule {}