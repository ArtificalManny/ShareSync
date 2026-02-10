// src/realtime/ws-user.decorator.ts
// ═══════════════════════════════════════════════════════════════════════════════
// WS USER DECORATOR
// Pulls authenticated user off socket.data.user (set by WsJwtGuard)
// ═══════════════════════════════════════════════════════════════════════════════

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Socket } from 'socket.io';

export type WsAuthedUser = {
  userId: string;
  email?: string;
  username?: string;
  roles?: string[];
};

export const WsUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): WsAuthedUser | undefined => {
    const client = ctx.switchToWs().getClient<Socket>();
    return (client?.data as any)?.user as WsAuthedUser | undefined;
  },
);
