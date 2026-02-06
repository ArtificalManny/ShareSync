// src/integrations/providers/slack.provider.ts
// ═══════════════════════════════════════════════════════════════════════════════
// SLACK INTEGRATION PROVIDER
// ═══════════════════════════════════════════════════════════════════════════════

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as crypto from 'crypto';

@Injectable()
export class SlackProvider {
  private readonly logger = new Logger(SlackProvider.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly signingSecret: string;
  private readonly redirectUri: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.clientId = this.configService.get<string>('SLACK_CLIENT_ID', '');
    this.clientSecret = this.configService.get<string>('SLACK_CLIENT_SECRET', '');
    this.signingSecret = this.configService.get<string>('SLACK_SIGNING_SECRET', '');
    this.redirectUri = this.configService.get<string>('SLACK_REDIRECT_URI', '');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // OAUTH
  // ─────────────────────────────────────────────────────────────────────────────

  getAuthUrl(state: string): string {
    const scopes = [
      'chat:write',
      'channels:read',
      'users:read',
      'commands',
      'incoming-webhook',
    ].join(',');
    
    return `https://slack.com/oauth/v2/authorize?client_id=${this.clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(this.redirectUri)}&state=${state}`;
  }

  async exchangeCodeForToken(code: string): Promise<{
    accessToken: string;
    teamId: string;
    teamName: string;
    userId: string;
    incomingWebhook?: {
      channel: string;
      url: string;
    };
  }> {
    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.redirectUri,
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || 'Failed to exchange code');
    }

    return {
      accessToken: data.access_token,
      teamId: data.team.id,
      teamName: data.team.name,
      userId: data.authed_user.id,
      incomingWebhook: data.incoming_webhook ? {
        channel: data.incoming_webhook.channel,
        url: data.incoming_webhook.url,
      } : undefined,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // API CALLS
  // ─────────────────────────────────────────────────────────────────────────────

  async sendMessage(
    accessToken: string,
    channel: string,
    text: string,
    blocks?: any[],
  ): Promise<any> {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel,
        text,
        blocks,
      }),
    });

    return response.json();
  }

  async getChannels(accessToken: string): Promise<any[]> {
    const response = await fetch(
      'https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=200',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const data = await response.json();
    return data.channels || [];
  }

  async getUserInfo(accessToken: string, userId: string): Promise<any> {
    const response = await fetch(
      `https://slack.com/api/users.info?user=${userId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const data = await response.json();
    return data.user;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // WEBHOOKS & COMMANDS
  // ─────────────────────────────────────────────────────────────────────────────

  verifySlackRequest(
    timestamp: string,
    body: string,
    signature: string,
  ): boolean {
    const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 60 * 5;
    if (parseInt(timestamp, 10) < fiveMinutesAgo) {
      return false;
    }

    const sigBasestring = `v0:${timestamp}:${body}`;
    const mySignature = 'v0=' + crypto
      .createHmac('sha256', this.signingSecret)
      .update(sigBasestring)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(mySignature),
      Buffer.from(signature),
    );
  }

  async handleSlashCommand(
    command: string,
    text: string,
    userId: string,
    channelId: string,
    responseUrl: string,
  ): Promise<{ text: string; response_type?: string }> {
    this.logger.log(`Processing Slack command: ${command} ${text}`);

    switch (command) {
      case '/sharesync':
        return this.handleShareSyncCommand(text, userId, channelId);
      case '/task':
        return this.handleTaskCommand(text, userId, channelId);
      case '/status':
        return this.handleStatusCommand(userId);
      default:
        return { text: `Unknown command: ${command}` };
    }
  }

  private async handleShareSyncCommand(
    text: string,
    userId: string,
    channelId: string,
  ): Promise<{ text: string; response_type?: string }> {
    const parts = text.trim().split(' ');
    const subCommand = parts[0];

    switch (subCommand) {
      case 'help':
        return {
          text: `*ShareSync Commands*\n• \`/sharesync status\` - View your current status\n• \`/sharesync tasks\` - List your tasks\n• \`/task create [title]\` - Create a new task`,
          response_type: 'ephemeral',
        };
      case 'status':
        return this.handleStatusCommand(userId);
      case 'tasks':
        return {
          text: '📋 Fetching your tasks...',
          response_type: 'ephemeral',
        };
      default:
        return {
          text: 'Use `/sharesync help` to see available commands',
          response_type: 'ephemeral',
        };
    }
  }

  private async handleTaskCommand(
    text: string,
    userId: string,
    channelId: string,
  ): Promise<{ text: string; response_type?: string }> {
    if (!text.trim()) {
      return { text: 'Please provide a task title: `/task My new task`' };
    }

    this.eventEmitter.emit('slack.task.create', {
      title: text.trim(),
      slackUserId: userId,
      channelId,
    });

    return {
      text: `✅ Creating task: "${text.trim()}"`,
      response_type: 'in_channel',
    };
  }

  private async handleStatusCommand(
    userId: string,
  ): Promise<{ text: string; response_type?: string }> {
    // This would fetch actual user stats
    return {
      text: `📊 *Your Status*\n• Tasks completed today: 3\n• Current streak: 🔥 5 days\n• Level: 12 (Expert)`,
      response_type: 'ephemeral',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // NOTIFICATION FORMATTING
  // ─────────────────────────────────────────────────────────────────────────────

  formatTaskNotification(task: any, action: string): any[] {
    return [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Task ${action}:* ${task.title}`,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Priority: ${task.priority} | Status: ${task.status}`,
          },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'View Task' },
            url: `${this.configService.get('APP_URL')}/tasks/${task.id}`,
          },
        ],
      },
    ];
  }
}
