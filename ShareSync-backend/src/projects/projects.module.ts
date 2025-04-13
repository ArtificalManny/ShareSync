import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { Project, ProjectSchema } from './schemas/project.schema';
import { NotificationsModule } from '../notifications/notifications.module'; // Import NotificationsModule
import { PointsModule } from '../points/points.module'; // Import PointsModule

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
    NotificationsModule, // Add NotificationsModule to provide NotificationsService
    PointsModule, // Add PointsModule to provide PointsService
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}