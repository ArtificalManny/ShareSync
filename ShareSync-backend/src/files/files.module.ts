// src/files/files.module.ts
// ═══════════════════════════════════════════════════════════════════════════════
// FILES MODULE
// ═══════════════════════════════════════════════════════════════════════════════

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { File, FileSchema } from './schemas/file.schema';
import { Folder, FolderSchema } from './schemas/folder.schema';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: File.name, schema: FileSchema },
      { name: Folder.name, schema: FolderSchema },
    ]),
    ActivitiesModule,
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
