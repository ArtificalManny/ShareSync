// backend/src/momentum/momentum.gateway.ts
import { WebSocketGateway, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { MomentumService } from './momentum.service';

@WebSocketGateway({ cors: true })
export class MomentumGateway {
  constructor(private readonly momentumService: MomentumService) {}

  @SubscribeMessage('streak:request')
  async handleStreak(@MessageBody() data: { userId: string }) {
    const streak = await this.momentumService.getStreak(data.userId);
    return { event: 'streak:update', data: { userId: data.userId, streak } };
  }

  @SubscribeMessage('leaderboard:request')
  async handleLeaderboard(@MessageBody() data: { limit?: number }) {
    const leaderboard = await this.momentumService.getLeaderboard(data.limit);
    return { event: 'leaderboard:update', data: leaderboard };
  }

  @SubscribeMessage('score:request')
  async handleScore(@MessageBody() data: { userId: string }) {
    const score = await this.momentumService.getMomentumScore(data.userId);
    return { event: 'score:update', data: { userId: data.userId, score } };
  }
}