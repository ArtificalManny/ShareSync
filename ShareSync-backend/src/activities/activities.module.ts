// /src/activities/activities.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';

import { RealtimeModule } from '../realtime/realtime.module';

// Minimal Activity schema to back InjectModel('Activity')
import { Schema } from 'mongoose';
const ActivitySchema = new Schema(
  {
    projectId: { type: String, required: true },
    userId: { type: String, required: true },
    type: { type: String, default: 'update' },
    text: { type: String, default: '' },
    meta: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: () => new Date() },
    updatedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Activity', schema: ActivitySchema }]),
    RealtimeModule, // exports RealtimeGateway
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
