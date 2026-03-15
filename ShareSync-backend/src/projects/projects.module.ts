// src/projects/projects.module.ts
// ═══════════════════════════════════════════════════════════════════════════════
// PROJECTS MODULE
// ═══════════════════════════════════════════════════════════════════════════════

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Project, ProjectSchema } from './schemas/project.schema';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

// ✅ Invites (subdocuments on Project, not a separate collection)
import { InvitesService } from './invites.service';
import { InvitesController, GlobalInvitesController } from './invites.controller';
// ✅ Phase 3: follows (needed because ProjectsController injects ProjectFollowService)
import { ProjectFollowModule } from '../follows/project-follow.module';
import { RealtimeModule } from '../realtime/realtime.module';import { ModerationModule } from '../moderation/moderation.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),

    // ✅ allows DI of ProjectFollowService in ProjectsController
    ProjectFollowModule,

    // ✅ allows DI of RealtimeGateway in InvitesService
    RealtimeModule,

    // ✅ Content moderation for project name/description
    ModerationModule,
  ],
  controllers: [ProjectsController, InvitesController, GlobalInvitesController],
  providers: [ProjectsService, InvitesService],
  exports: [ProjectsService, InvitesService],
})
export class ProjectsModule {}
