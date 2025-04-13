import { Module } from '@nestjs/common';
import { PointsService } from './points.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule], // Import UsersModule to access UserModel
  providers: [PointsService],
  exports: [PointsService],
})
export class PointsModule {}