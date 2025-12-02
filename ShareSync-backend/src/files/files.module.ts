// src/files/files.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { FilesController } from './files.controller';
import { FilesService } from './files.service';

import { File, FileSchema } from './schemas/file.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { ProjectModule } from '../projects/project.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: File.name, schema: FileSchema },
      { name: Project.name, schema: ProjectSchema }, // for @InjectModel(Project)
    ]),
    forwardRef(() => ProjectModule),   // if Projects and Files reference each other
    forwardRef(() => RealtimeModule),  // ✅ RealtimeModule now exports RealtimeGateway
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
