// src/content-reports/content-reports.module.ts
// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT REPORTS MODULE — User content moderation system
// ═══════════════════════════════════════════════════════════════════════════════

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContentReportsController } from './content-reports.controller';
import { ContentReportsService } from './content-reports.service';
import {
  ContentReport,
  ContentReportSchema,
} from './schemas/content-report.schema';
import { User, UserSchema } from '../user/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ContentReport.name, schema: ContentReportSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ContentReportsController],
  providers: [ContentReportsService],
  exports: [ContentReportsService],
})
export class ContentReportsModule {}
