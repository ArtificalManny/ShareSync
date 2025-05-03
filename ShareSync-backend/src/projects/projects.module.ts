import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectsController } from '../project/projects.controller';
import { ProjectsService } from './projects.service';
import { Project, ProjectSchema } from '../project/schemas/project.schema';
import { AppGateway } from '../app.gateway';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
    NotificationsModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService, AppGateway],
})
export class ProjectsModule {}