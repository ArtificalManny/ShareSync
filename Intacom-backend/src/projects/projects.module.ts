import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from '../../../models/project.model'; // Updated path
import { ProjectsService } from './projects.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }])],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}