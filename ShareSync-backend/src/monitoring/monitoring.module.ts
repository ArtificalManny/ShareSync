// src/monitoring/monitoring.module.ts
import { Module, Global } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MonitoringService } from './monitoring.service';
import { MonitoringController } from './monitoring.controller';

@Global()
@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [MonitoringController],
  providers: [MonitoringService],
  exports: [MonitoringService],
})
export class MonitoringModule {}
