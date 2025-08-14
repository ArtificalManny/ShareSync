// src/projects/project.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { ProjectController } from './project.controller';
import { ProjectsService } from './project.service';
import { Project, ProjectSchema } from './schemas/project.schema';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
  ],
  controllers: [ProjectController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectModule {}
