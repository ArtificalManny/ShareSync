import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { File, FileSchema } from './schemas/file.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { RealtimeModule } from '../realtime/realtime.module'; // ✅ use existing gateway instance

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: File.name, schema: FileSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
    // bring the gateway in via its module so we don't create duplicate providers
    forwardRef(() => RealtimeModule),
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}