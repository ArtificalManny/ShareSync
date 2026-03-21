// src/follows/follows.module.ts
// ═══════════════════════════════════════════════════════════════════════════════
// FOLLOWS MODULE - Instagram-style project following
// Exports FollowsService so Discovery and other modules can check follow status
// ═══════════════════════════════════════════════════════════════════════════════

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FollowsController } from './follows.controller';
import { FollowsService } from './follows.service';
import { FollowSchema } from './schemas/follow.schema';
import { ProjectSchema } from '../projects/schemas/project.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Follow', schema: FollowSchema },
      { name: 'Project', schema: ProjectSchema },
    ]),
  ],
  controllers: [FollowsController],
  providers: [FollowsService],
  exports: [FollowsService],
})
export class FollowsModule {}
