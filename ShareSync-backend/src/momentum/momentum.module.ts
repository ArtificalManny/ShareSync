// backend/src/momentum/momentum.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MomentumService } from './momentum.service';
import { MomentumController } from './momentum.controller';
import { MomentumGateway } from './momentum.gateway';

import { ProjectModule } from '../projects/project.module';
import { TaskModule } from '../tasks/task.module';
import { UserModule } from '../user/user.module';     // ← NEW
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    forwardRef(() => ProjectModule),
    forwardRef(() => TaskModule),
    forwardRef(() => UserModule),   // ← NEW
    forwardRef(() => AuditModule),
  ],
  controllers: [MomentumController],
  providers: [MomentumService, MomentumGateway],
  exports: [MomentumService],
})
export class MomentumModule {}