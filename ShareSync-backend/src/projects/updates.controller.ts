// src/projects/updates.controller.ts
import {
    Body,
    Controller,
    Param,
    Post,
    BadRequestException,
  } from '@nestjs/common';
  import { Throttle } from '@nestjs/throttler';
  import { ModerationService } from '../moderation/moderation.service';
  import { NotificationsGateway } from '../notifications/gateway';
  
  type CreateUpdateDto = {
    text: string;
    mentions?: string[];
    files?: string[]; // previously uploaded file IDs (already moderated in /uploads)
  };
  
  @Controller('projects/:id/updates')
  export class UpdatesController {
    constructor(
      private readonly moderation: ModerationService,
      private readonly gateway: NotificationsGateway,
    ) {}
  
    /**
     * Rate limit (v5 syntax):
     * - We keep your global TTL=60s from AppModule.
     * - Here we override the limit just for this route (10 req / 60s).
     *
     * Note: In Throttler v5, @Throttle takes an object:
     *   @Throttle({ default: { limit: number, ttl?: number } })
     */
    @Throttle({ default: { limit: 10 } })
    @Post()
    async create(
      @Param('id') projectId: string,
      @Body() dto: CreateUpdateDto,
    ): Promise<
      | { ok: false; moderation: { status: 'blocked'; reason?: string } }
      | {
          ok: true;
          update: {
            id: string;
            projectId: string;
            text: string;
            mentions: string[];
            attachments: { id: string }[];
            moderationStatus: 'allowed' | 'pending';
            createdAt: string;
            type: 'update.posted';
          };
        }
    > {
      if (!dto || (!dto.text && (!dto.files || !dto.files.length))) {
        throw new BadRequestException('Update must include text or attachments.');
      }
  
      // 1) Text moderation
      const textMod = await this.moderation.checkText(dto.text || '');
  
      if (textMod.decision === 'BLOCK') {
        await this.moderation.logDecision({
          kind: 'update',
          projectId,
          decision: 'BLOCK',
          reason: textMod.reason,
          ts: Date.now(),
        });
        return { ok: false, moderation: { status: 'blocked', reason: textMod.reason } };
      }
  
      // If text requires review, mark pending; otherwise allowed.
      const moderationStatus: 'allowed' | 'pending' =
        textMod.decision === 'REVIEW' ? 'pending' : 'allowed';
  
      // 2) Persist update (stub; replace with DB write)
      const created = {
        id: String(Date.now()),
        projectId,
        text: dto.text || '',
        mentions: Array.isArray(dto.mentions) ? dto.mentions : [],
        attachments: (dto.files || []).map((id) => ({ id })),
        moderationStatus,
        createdAt: new Date().toISOString(),
        type: 'update.posted' as const,
      };
  
      await this.moderation.logDecision({
        kind: 'update',
        projectId,
        decision: moderationStatus === 'allowed' ? 'ALLOW' : 'REVIEW',
        ts: Date.now(),
      });
  
      // 3) Realtime: only broadcast if allowed
      if (moderationStatus === 'allowed') {
        this.gateway.emitToProject(projectId, 'activity:new', created);
      }
  
      return { ok: true, update: created };
    }
  }  