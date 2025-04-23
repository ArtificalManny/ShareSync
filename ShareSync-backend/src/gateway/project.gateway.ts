import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ProjectsService } from '../projects/projects.service';

@WebSocketGateway({ cors: { origin: 'http://localhost:54693', credentials: true } })
export class ProjectGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly projectsService: ProjectsService) {}

  @SubscribeMessage('projectCreated')
  async handleProjectCreated(client: any, payload: { projectId: string; title: string; description: string }) {
    const { projectId, title, description } = payload;
    const activity = {
      type: 'projectCreated',
      message: `New project created: ${title}`,
      timestamp: new Date(),
    };
    await this.projectsService.addTeamActivity(projectId, activity);
    this.server.emit('teamActivity', { projectId, activity });
  }
}