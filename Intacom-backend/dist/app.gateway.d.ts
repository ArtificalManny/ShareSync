import { Server, Socket } from 'socket.io';
export declare class AppGateway {
    server: Server;
    afterInit(server: Server): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinProject(client: Socket, data: {
        projectId: string;
    }): void;
    handleLeaveProject(client: Socket, data: {
        projectId: string;
    }): void;
    handleJoinUser(client: Socket, data: {
        userId: string;
    }): void;
    emitProjectCreated(project: any): void;
    emitNotificationCreated(notification: any): void;
    emitTaskCompleted(task: any): void;
}
