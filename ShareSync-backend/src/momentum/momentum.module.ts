// src/momentum/momentum.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MomentumService } from './momentum.service';
import { MomentumGateway } from './momentum.gateway';
import { MomentumController } from './momentum.controller';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { Task, TaskSchema } from '../tasks/schemas/task.schema';
import { User, UserSchema } from '../user/schemas/user.schema';
import { AuditService } from '../audit/audit.service';
import { Audit, AuditSchema } from '../audit/schemas/audit.schema';
import { PresenceService } from '../presence/presence.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: Task.name, schema: TaskSchema },
      { name: User.name, schema: UserSchema },
      { name: Audit.name, schema: AuditSchema },
    ]),
  ],
  providers: [MomentumService, MomentumGateway, AuditService, PresenceService],
  controllers: [MomentumController],
  exports: [MomentumService],
})
export class MomentumModule {}