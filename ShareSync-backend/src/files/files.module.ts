// backend/src/files/files.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { File, FileSchema } from './schemas/file.schema';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { ProjectModule } from '../projects/project.module';
import { RealtimeModule } from '../realtime/realtime.module';   // ← NEW

@Module({
  imports: [
    MongooseModule.forFeature([{ name: File.name, schema: FileSchema }]),
    forwardRef(() => ProjectModule),
    forwardRef(() => RealtimeModule),   // ← NEW (provides REALTIME_GATEWAY)
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}