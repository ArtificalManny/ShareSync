import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ProjectService } from '../projects/project.service';

@WebSocketGateway({ cors: true })
export class ProjectGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly projectService: ProjectService) {}

  @SubscribeMessage('projectUpdate')
  async handleProjectUpdate(client: any, payload: { projectId: string }) {
    const project = await this.projectService.findOne(payload.projectId);
    this.server.emit('projectUpdated', project);
  }

  @SubscribeMessage('taskUpdate')
  async handleTaskUpdate(client: any, payload: { projectId: string; taskId: string }) {
    const project = await this.projectService.findOne(payload.projectId);
    this.server.emit('taskUpdated', { projectId: payload.projectId, taskId: payload.taskId, project });
  }
}