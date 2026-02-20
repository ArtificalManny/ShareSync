// src/moderation/moderation.interceptor.ts
// ═══════════════════════════════════════════════════════════════════════════════
// TEXT MODERATION INTERCEPTOR — Auto-check requests before they hit controllers
// Apply this globally or to specific routes
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TextModerationService, ModerationResult } from './text-moderation.service';

// Fields to automatically check for moderation
const TEXT_FIELDS_TO_CHECK = [
  'content',
  'description',
  'bio',
  'name',
  'title',
  'message',
  'comment',
  'text',
  'body',
  'subject',
  'note',
  'reason',
];

// Extended request interface to attach moderation flags
export interface ModerationFlaggedRequest extends Request {
  moderationFlags?: Array<{
    field: string;
    result: ModerationResult;
  }>;
}

@Injectable()
export class TextModerationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TextModerationInterceptor.name);

  constructor(private textModerationService: TextModerationService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    
    // SAFEGUARD: Ensure request exists before accessing properties
    if (!request) return next.handle();
    
    const body = request.body;

    // Skip if no body or not an object
    if (!body || typeof body !== 'object') {
      return next.handle();
    }

    // Check each text field
    for (const field of TEXT_FIELDS_TO_CHECK) {
      if (body[field] && typeof body[field] === 'string') {
        const result = await this.textModerationService.moderateText(body[field]);

        if (result.action === 'block') {
          this.logger.warn(
            `🚫 Content blocked in field "${field}": ${result.reason}`
          );

          throw new BadRequestException({
            error: 'Content Policy Violation',
            message: 'This content violates our community guidelines and cannot be posted.',
            code: 'CONTENT_BLOCKED',
            field,
            categories: result.categories,
          });
        }

        // Attach moderation result for review queue if flagged but not blocked
        if (result.action === 'review') {
          request.moderationFlags = request.moderationFlags || [];
          request.moderationFlags.push({
            field,
            result,
          });

          this.logger.log(
            `⚠️ Content flagged for review in field "${field}": ${result.reason}`
          );
        }
      }
    }

    // Also check nested objects (one level deep)
    for (const key of Object.keys(body)) {
      const value = body[key];
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        for (const field of TEXT_FIELDS_TO_CHECK) {
          if (value[field] && typeof value[field] === 'string') {
            const result = await this.textModerationService.moderateText(value[field]);

            if (result.action === 'block') {
              this.logger.warn(
                `🚫 Content blocked in nested field "${key}.${field}": ${result.reason}`
              );

              throw new BadRequestException({
                error: 'Content Policy Violation',
                message: 'This content violates our community guidelines and cannot be posted.',
                code: 'CONTENT_BLOCKED',
                field: `${key}.${field}`,
                categories: result.categories,
              });
            }

            if (result.action === 'review') {
              request.moderationFlags = request.moderationFlags || [];
              request.moderationFlags.push({
                field: `${key}.${field}`,
                result,
              });
            }
          }
        }
      }
    }

    return next.handle();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DECORATOR: Skip Moderation
// Use @SkipModeration() on handlers that shouldn't be moderated
// ═══════════════════════════════════════════════════════════════════════════════
import { SetMetadata } from '@nestjs/common';
export const SKIP_MODERATION_KEY = 'skipModeration';
export const SkipModeration = () => SetMetadata(SKIP_MODERATION_KEY, true);
