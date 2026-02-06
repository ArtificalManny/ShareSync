// src/integrations/providers/github.provider.ts
// ═══════════════════════════════════════════════════════════════════════════════
// GITHUB INTEGRATION PROVIDER
// ═══════════════════════════════════════════════════════════════════════════════

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as crypto from 'crypto';

@Injectable()
export class GitHubProvider {
  private readonly logger = new Logger(GitHubProvider.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.clientId = this.configService.get<string>('GITHUB_CLIENT_ID', '');
    this.clientSecret = this.configService.get<string>('GITHUB_CLIENT_SECRET', '');
    this.redirectUri = this.configService.get<string>('GITHUB_REDIRECT_URI', '');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // OAUTH
  // ─────────────────────────────────────────────────────────────────────────────

  getAuthUrl(state: string): string {
    const scopes = ['repo', 'user:email', 'read:org'].join(' ');
    return `https://github.com/login/oauth/authorize?client_id=${this.clientId}&redirect_uri=${encodeURIComponent(this.redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${state}`;
  }

  async exchangeCodeForToken(code: string): Promise<{
    accessToken: string;
    tokenType: string;
    scope: string;
  }> {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.redirectUri,
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error_description || data.error);
    }

    return {
      accessToken: data.access_token,
      tokenType: data.token_type,
      scope: data.scope,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // API CALLS
  // ─────────────────────────────────────────────────────────────────────────────

  async getUser(accessToken: string): Promise<any> {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    return response.json();
  }

  async getRepositories(accessToken: string): Promise<any[]> {
    const response = await fetch('https://api.github.com/user/repos?per_page=100', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    return response.json();
  }

  async getPullRequest(
    accessToken: string,
    owner: string,
    repo: string,
    prNumber: number,
  ): Promise<any> {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      },
    );

    return response.json();
  }

  async createComment(
    accessToken: string,
    owner: string,
    repo: string,
    issueNumber: number,
    body: string,
  ): Promise<any> {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ body }),
      },
    );

    return response.json();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // WEBHOOKS
  // ─────────────────────────────────────────────────────────────────────────────

  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  }

  async handleWebhook(
    event: string,
    payload: any,
    integrationId: string,
  ): Promise<void> {
    this.logger.log(`Processing GitHub webhook: ${event}`);

    switch (event) {
      case 'pull_request':
        await this.handlePullRequest(payload, integrationId);
        break;
      case 'push':
        await this.handlePush(payload, integrationId);
        break;
      case 'issues':
        await this.handleIssue(payload, integrationId);
        break;
      default:
        this.logger.debug(`Unhandled GitHub event: ${event}`);
    }
  }

  private async handlePullRequest(payload: any, integrationId: string): Promise<void> {
    const { action, pull_request, repository } = payload;

    this.eventEmitter.emit('github.pull_request', {
      integrationId,
      action,
      prNumber: pull_request.number,
      prTitle: pull_request.title,
      prUrl: pull_request.html_url,
      prState: pull_request.state,
      merged: pull_request.merged,
      repository: repository.full_name,
      author: pull_request.user.login,
    });
  }

  private async handlePush(payload: any, integrationId: string): Promise<void> {
    const { ref, commits, repository, pusher } = payload;

    this.eventEmitter.emit('github.push', {
      integrationId,
      branch: ref.replace('refs/heads/', ''),
      commitCount: commits?.length || 0,
      repository: repository.full_name,
      pusher: pusher.name,
      commits: commits?.slice(0, 5).map((c: any) => ({
        message: c.message,
        author: c.author.name,
        url: c.url,
      })),
    });
  }

  private async handleIssue(payload: any, integrationId: string): Promise<void> {
    const { action, issue, repository } = payload;

    this.eventEmitter.emit('github.issue', {
      integrationId,
      action,
      issueNumber: issue.number,
      issueTitle: issue.title,
      issueUrl: issue.html_url,
      issueState: issue.state,
      repository: repository.full_name,
      author: issue.user.login,
    });
  }
}
