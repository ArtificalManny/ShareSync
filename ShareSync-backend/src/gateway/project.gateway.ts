import { SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ProjectsService } from '../projects/projects.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ cors: true })
export class ProjectGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private projectsService: ProjectsService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      const payload = this.jwtService.verify(token);
      client.data.user = payload;
      console.log('Client connected:', client.id, payload.email);
    } catch (err) {
      console.error('Connection error:', err.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }

  @SubscribeMessage('joinProject')
  async handleJoinProject(client: Socket, projectId: string) {
    client.join(projectId);
    console.log(`Client ${client.id} joined project ${projectId}`);

    const activity = {
      user: client.data.user.email,
      action: 'joined the project',
      timestamp: new Date().toISOString(),
    };

    await this.projectsService.addTeamActivity(projectId, activity);
    this.server.to(projectId).emit('teamActivity', activity);
    this.server.to(projectId).emit('memberActivity', {
      email: client.data.user.email,
      lastActive: activity.timestamp,
    });
  }

  @SubscribeMessage('newPost')
  handleNewPost(client: Socket, post: { projectId: string; post: any }) {
    this.server.to(post.projectId).emit('newPost', post.post);
  }
}