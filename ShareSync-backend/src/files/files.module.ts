// src/files/files.module.ts
// ═══════════════════════════════════════════════════════════════════════════════
// FILES MODULE
// ═══════════════════════════════════════════════════════════════════════════════

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { File, FileSchema } from './schemas/file.schema';
import { Folder, FolderSchema } from './schemas/folder.schema';
import { FilesService } from './files.service';
import { ActivitiesModule } from '../activities/activities.module';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: File.name, schema: FileSchema },
      { name: Folder.name, schema: FolderSchema },
    ]),
    ActivitiesModule,
    UploadsModule,
  ],
  // openshare-legacy-files-controller-retired-v1
  //
  // The original /files/* HTTP surface is intentionally no longer
  // mounted. Project file management is served by the hardened Vault
  // subsystem. Keep FilesService and its model registrations available
  // for compatibility without exposing the legacy controller routes.
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
