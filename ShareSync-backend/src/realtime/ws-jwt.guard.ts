// src/realtime/ws-jwt.guard.ts
// ═══════════════════════════════════════════════════════════════════════════════
// WS JWT GUARD
// - Validates JWT from socket handshake
// - Attaches user onto client.data.user for downstream handlers
//
// Token sources supported:
//   1) socket.handshake.auth.token
//   2) socket.handshake.headers.authorization = "Bearer <token>"
//
// Safe + minimal: only enforces auth for WS handlers using @UseGuards(WsJwtGuard)
// ═══════════════════════════════════════════════════════════════════════════════

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Socket } from 'socket.io';

type JwtPayload = {
  sub?: string;
  userId?: string;
  email?: string;
  username?: string;
  roles?: string[];
  iat?: number;
  exp?: number;
};

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<Socket>();
    const token = this.extractToken(client);

    if (!token) {
      throw new UnauthorizedException('Missing WS auth token');
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);

      const userId = payload.userId || payload.sub;
      if (!userId) {
        throw new UnauthorizedException('Invalid WS auth token payload');
      }

      // Attach a small, stable shape for handlers/decorators
      (client.data as any).user = {
        userId,
        email: payload.email,
        username: payload.username,
        roles: payload.roles,
      };

      return true;
    } catch (_err) {
      throw new UnauthorizedException('Invalid or expired WS auth token');
    }
  }

  private extractToken(client: Socket): string | null {
    // 1) handshake.auth.token
    const authToken = (client.handshake as any)?.auth?.token;
    if (typeof authToken === 'string' && authToken.trim()) {
      return authToken.trim();
    }

    // 2) Authorization header
    const authHeader = client.handshake?.headers?.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.slice('Bearer '.length).trim();
    }

    return null;
  }
}
