import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from '../../../Intacom-frontend/projects.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from '../../models/project.model';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}