// src/realtime/realtime.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { ProjectModule } from '../projects/project.module';

@Module({
  imports: [
    // only if your gateway needs ProjectsService; keep/remove as your gateway requires
    forwardRef(() => ProjectModule),
  ],
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],            // ⬅️ critical
})
export class RealtimeModule {}