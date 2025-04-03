import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PointsService } from './points.service';
import { PointsController } from './points.controller';
import { Point, PointSchema } from './schemas/point.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Point.name, schema: PointSchema }]),
  ],
  controllers: [PointsController],
  providers: [PointsService],
  exports: [PointsService],
})
export class PointsModule {}