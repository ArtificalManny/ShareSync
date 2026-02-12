// src/follows/project-follow.module.ts
// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT FOLLOW MODULE
// Provides follow/unfollow + follower preferences.
// Export ProjectFollowService so other modules (Projects, Notifications, etc.) can inject it.
// ═══════════════════════════════════════════════════════════════════════════════

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ProjectFollow, ProjectFollowSchema } from './schemas/project-follow.schema';
import { ProjectFollowService } from './project-follow.service';
import { ProjectFollowController } from './project-follow.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProjectFollow.name, schema: ProjectFollowSchema },
    ]),
  ],
  controllers: [ProjectFollowController],
  providers: [ProjectFollowService],
  exports: [ProjectFollowService], // ✅ critical
})
export class ProjectFollowModule {}
