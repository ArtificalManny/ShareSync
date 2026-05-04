import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AIService } from './ai.service';
import { SuggestionType, ChatRequestDto } from './dto';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AIController {
  constructor(private readonly aiService: AIService) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // NEW ENDPOINTS (For MentorDock & AISuggestionCard)
  // ─────────────────────────────────────────────────────────────────────────────

  @Post('chat')
  async chat(@Body() body: any) {
    const contextData = {
      scope: body.scope,
      projectId: body.projectId,
      items: body.items,
      mentorTone: body.mentorTone || '',
    };

    const text = await this.aiService.generateChatResponse(body.prompt, contextData);
    return { text };
  }

  @Get('suggestion')
  async getSingleSuggestion() {
    const suggestion = await this.aiService.generateSingleSuggestion();
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

    return this.aiService.getSuggestions(userId, {
      type: query.type,
      projectId: query.projectId,
      limit,
    });
  }

  @Post('analyze-task')
  async analyzeTask(@Body() body: { taskId: string }) {
    return this.aiService.analyzeTask(body.taskId);
  }

  @Post('workload-analysis')
  async analyzeWorkload(@Body() body: { projectId: string; userIds?: string[] }) {
    return this.aiService.analyzeWorkload(body.projectId, body.userIds);
  }

  @Post('smart-schedule')
  async smartSchedule(@Body() body: { projectId: string; sprintId?: string }) {
    return this.aiService.generateSmartSchedule(body.projectId, body.sprintId);
  }

  @Get('suggestion-types')
  getSuggestionTypes() {
    return Object.values(SuggestionType);
  }
}
