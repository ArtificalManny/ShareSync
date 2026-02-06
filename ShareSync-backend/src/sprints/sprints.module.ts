// src/sprints/sprints.module.ts
// ═══════════════════════════════════════════════════════════════════════════════
// SPRINTS MODULE
// ═══════════════════════════════════════════════════════════════════════════════

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { Sprint, SprintSchema } from './schemas/sprint.schema';
import { SprintsController } from './sprints.controller';
import { SprintsService } from './sprints.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Sprint.name, schema: SprintSchema }]),
    ScheduleModule.forRoot(),
  ],
  controllers: [SprintsController],
  providers: [SprintsService],
  exports: [SprintsService],
})
export class SprintsModule {}
