import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ProjectsService } from '../project/projects.service';

@WebSocketGateway({ cors: { origin: 'http://localhost:54693', credentials: true } })
export class ProjectGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly projectsService: ProjectsService) {}

  @SubscribeMessage('joinProject')
  handleJoinProject(@MessageBody() projectId: string, @ConnectedSocket() client: Socket): void {
    client.join(projectId);
    this.server.to(projectId).emit('userJoined', { userId: client.id, projectId });
  }

  @SubscribeMessage('leaveProject')
  handleLeaveProject(@MessageBody() projectId: string, @ConnectedSocket() client: Socket): void {
    client.leave(projectId);
    this.server.to(projectId).emit('userLeft', { userId: client.id, projectId });
  }

  @SubscribeMessage('projectUpdate')
  async handleProjectUpdate(@MessageBody() data: { projectId: string; user: any; action: string; timestamp: string }): Promise<void> {
    const { projectId, user, action, timestamp } = data;
    const activity = `${user.email} ${action} at ${timestamp}`;
    await this.projectsService.addTeamActivity(projectId, activity);
    this.server.to(projectId).emit('projectUpdated', { user, action, timestamp });
  }
}