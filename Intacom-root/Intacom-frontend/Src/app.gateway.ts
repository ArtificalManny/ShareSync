import {
    WebSocketGateway,
    SubsceribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';

@WebSocketGateway({
    cors: {
        origin: '*', //Update as needed for security
    },
})
export class AppGateway {
    @SubsceribeMessage('joinProject')
    handleJoinProject(@MessageBody() data: { projectId: string }, @ConnectedSocket() client: Socket) {
        client.join(`project_${data.projectId}`);
    }
}