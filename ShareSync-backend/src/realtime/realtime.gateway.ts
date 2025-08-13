// src/realtime/realtime.gateway.ts
import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  
  @WebSocketGateway({
    cors: { origin: ['http://localhost:54693'], credentials: true },
    namespace: '/',
  })
  export class RealtimeGateway {
    @WebSocketServer() server: Server;
  
    handleConnection(client: Socket) {
      // no-op; could auth here later
    }
  
    handleDisconnect(client: Socket) {
      // no-op
    }
  
    /** Client asks to join a room: { room: 'project:<id>' | 'user:<id>' } */
    @SubscribeMessage('join')
    onJoin(@ConnectedSocket() client: Socket, @MessageBody() data: { room: string }) {
      const room = String(data?.room || '');
      if (!room) return;
      client.join(room);
      client.emit('joined', { room });
    }
  
    /** Client asks to leave a room */
    @SubscribeMessage('leave')
    onLeave(@ConnectedSocket() client: Socket, @MessageBody() data: { room: string }) {
      const room = String(data?.room || '');
      if (!room) return;
      client.leave(room);
      client.emit('left', { room });
    }
  
    /** Emitters used by services */
    emitToProject(projectId: string, event: string, payload: any) {
      this.server.to(`project:${projectId}`).emit(event, payload);
    }
  
    emitToUser(userId: string, event: string, payload: any) {
      this.server.to(`user:${userId}`).emit(event, payload);
    }
  }
  