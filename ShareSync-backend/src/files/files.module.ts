// src/files/files.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { FilesController } from './files.controller';
import { FilesService } from './files.service';

import { File, FileSchema } from './schemas/file.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema'; // ⬅️ bring back
import { ProjectModule } from '../projects/project.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: File.name, schema: FileSchema },
      { name: Project.name, schema: ProjectSchema }, // ⬅️ re-add this so @InjectModel(Project) works
    ]),
    forwardRef(() => ProjectModule), // ⬅️ for ProjectsService / guards
    forwardRef(() => RealtimeModule),
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}