import { Body, Controller, Get, HttpException, HttpStatus, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AIService } from './ai.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { SuggestionType, ChatRequestDto } from './dto';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AIController {
  constructor(
    private readonly aiService: AIService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  private getRequestUserId(req: Request): string | null {
    const user = (req as any)?.user || {};
    return user.sub || user.userId || user.id || null;
  }

  // openshare-ai-quota-preflight-v1
  //
  // Check quota before expensive AI work begins, then record usage only
  // after the AI operation succeeds. This avoids generating paid AI work
  // for an account whose current allowance is already exhausted.
  private async assertAiCallAllowed(
    req: Request,
    amount = 1,
  ): Promise<string | null> {
    const userId = this.getRequestUserId(req);

    if (!userId) {
      return null;
    }

    const usageCheck =
      await this.subscriptionsService.checkLimit(
        userId,
        'aiCalls',
        amount,
      );

    if (!usageCheck.allowed) {
      throw new HttpException(
        `AI call limit reached for your current plan. Limit: ${usageCheck.limit}.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return userId;
  }

  private async recordAiCall(
    userId: string | null,
    amount = 1,
  ): Promise<void> {
    if (!userId) {
      return;
    }

    await this.subscriptionsService.incrementUsage(
      userId,
      'aiCalls',
      amount,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // NEW ENDPOINTS (For MentorDock & AISuggestionCard)
  // ─────────────────────────────────────────────────────────────────────────────

  @Post('chat')
  async chat(@Req() req: Request, @Body() body: any) {
    const billingUserId =
      await this.assertAiCallAllowed(req);

    const contextData = {
      scope: body.scope,
      projectId: body.projectId,
      items: body.items,
      mentorTone: body.mentorTone || '',
    };

    const text = await this.aiService.generateChatResponse(body.prompt, contextData);

    await this.recordAiCall(
      billingUserId,
    );

    return { text };
  }

  @Get('suggestion')
  async getSingleSuggestion(@Req() req: Request) {
    const billingUserId =
      await this.assertAiCallAllowed(req);

    const suggestion = await this.aiService.generateSingleSuggestion();

    await this.recordAiCall(
      billingUserId,
    );

    // Wrap it in the exact JSON format your React AISuggestionCard expects
    return { suggestion };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PREVIOUS ENDPOINTS (Preserved completely)
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('suggestions')
  async getSuggestions(
    @Req() req: Request,
    @Query() query: { type?: SuggestionType; projectId?: string; limit?: string },
  ) {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const limit = query.limit ? Number(query.limit) : undefined;

    const billingUserId =
      await this.assertAiCallAllowed(req);

    const suggestions = await this.aiService.getSuggestions(userId, {
      type: query.type,
      projectId: query.projectId,
      limit,
    });

    await this.recordAiCall(
      billingUserId,
    );

    return suggestions;
  }

  @Post('analyze-task')
  async analyzeTask(
    @Req() req: Request,
    @Body() body: { taskId: string },
  ) {
    const billingUserId =
      await this.assertAiCallAllowed(req);

    const result =
      await this.aiService.analyzeTask(
        body.taskId,
      );

    await this.recordAiCall(
      billingUserId,
    );

    return result;
  }

  @Post('workload-analysis')
  async analyzeWorkload(
    @Req() req: Request,
    @Body() body: {
      projectId: string;
      userIds?: string[];
    },
  ) {
    const billingUserId =
      await this.assertAiCallAllowed(req);

    const result =
      await this.aiService.analyzeWorkload(
        body.projectId,
        body.userIds,
      );

    await this.recordAiCall(
      billingUserId,
    );

    return result;
  }

  @Post('smart-schedule')
  async smartSchedule(
    @Req() req: Request,
    @Body() body: {
      projectId: string;
      sprintId?: string;
    },
  ) {
    const billingUserId =
      await this.assertAiCallAllowed(req);

    const result =
      await this.aiService.generateSmartSchedule(
        body.projectId,
        body.sprintId,
      );

    await this.recordAiCall(
      billingUserId,
    );

    return result;
  }

  @Get('suggestion-types')
  getSuggestionTypes() {
    return Object.values(SuggestionType);
  }
}
