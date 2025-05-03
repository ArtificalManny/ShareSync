import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TeamActivityController } from './teamActivity.controller';
import { TeamActivityService } from './teamActivity.service';
import { TeamActivity, TeamActivitySchema } from '../notification/teamActivity.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: TeamActivity.name, schema: TeamActivitySchema }]),
  ],
  controllers: [TeamActivityController],
  providers: [TeamActivityService],
})
export class TeamActivityModule {}