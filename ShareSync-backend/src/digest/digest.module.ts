// src/digest/digest.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';

import { DigestService } from './digest.service';
import { DigestController } from './digest.controller';

import { ProjectSchema } from '../projects/schemas/project.schema';
import { MailerConfigModule } from '../mailer/mailer.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MailerConfigModule,
    MongooseModule.forFeature([{ name: 'Project', schema: ProjectSchema }]),
  ],
  providers: [DigestService],
  controllers: [DigestController],
  exports: [DigestService],
})
export class DigestModule {}
