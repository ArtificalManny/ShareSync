/**
 * ws-jwt.guard.ts
 * WebSocket JWT authentication guard
 * 
 * Extracts JWT from Socket.IO handshake and attaches user to socket
 */

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { validateWsSession } from './ws-session.validator';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();
      
      // Extract token from handshake auth or query params
      const token = this.extractToken(client);

      if (!token) {
        throw new WsException('No token provided');
      }

      // Verify and decode token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'dev_secret_change_me',
      });

      const session = await validateWsSession(
        this.connection,
        payload,
      );

      // Attach current live account state, not stale identity/roles copied into
      // an older JWT.
      (client as any).user = {
        id: session.userId,
        userId: session.userId,
        email: session.user?.email || payload.email,
        username: session.user?.username || payload.username,
        roles: session.user?.roles || payload.roles || [],
      };

      return true;
    } catch (error) {
      console.error('WebSocket auth failed:', error);
      throw new WsException('Authentication failed');
    }
  }

  /**
   * Extract JWT token from Socket.IO handshake
   * Supports multiple auth methods:
   * 1. auth.token (Socket.IO client auth option)
   * 2. query.token (URL query param)
   * 3. headers.authorization (Bearer token)
   */
  private extractToken(client: Socket): string | null {
    try {
      // Method 1: Socket.IO auth option
      // client.io.on('connection', (socket) => { auth: { token: 'xxx' } })
      if (client.handshake?.auth?.token) {
        return client.handshake.auth.token;
      }

      // Method 2: Query parameter
      // io.connect('ws://localhost:3000?token=xxx')
      if (client.handshake?.query?.token) {
        return client.handshake.query.token as string;
      }

      // Method 3: Authorization header (Bearer token)
      const authHeader = client.handshake?.headers?.authorization;
      if (authHeader) {
        const [scheme, token] = authHeader.split(' ');
        if (/^bearer$/i.test(scheme) && token) {
          return token;
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to extract token:', error);
      return null;
    }
  }
}