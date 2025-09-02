// src/files/files.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { File, FileSchema } from './schemas/file.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: File.name, schema: FileSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
  ],
  controllers: [FilesController],
  providers: [FilesService, RealtimeGateway],
  exports: [FilesService],
})
export class FilesModule {}
