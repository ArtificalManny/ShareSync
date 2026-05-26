// src/suggestions/suggestions.controller.ts
// ═══════════════════════════════════════════════════════════════════════════════
// ✅ FIX: Removed 'api/' prefix (NestJS global prefix already adds it)
// ✅ FIX: Use TextModerationInterceptor (not TextModerationService)
// ═══════════════════════════════════════════════════════════════════════════════

import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, Request } from '@nestjs/common';
import { SuggestionsService } from './suggestions.service';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { UpdateSuggestionDto } from './dto/update-suggestion.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TextModerationInterceptor } from '../moderation/moderation.interceptor';

@Controller('projects/:projectId/suggestions')
@UseGuards(JwtAuthGuard)
export class SuggestionsController {
  constructor(private readonly suggestionsService: SuggestionsService) {}

  @Post()
  @UseInterceptors(TextModerationInterceptor)
  create(
    @Param('projectId') projectId: string,
    @Body() createSuggestionDto: CreateSuggestionDto,
    @Request() req
  ) {
    const userId = req.user.id || req.user._id || req.user.sub;
    return this.suggestionsService.create(projectId, userId, createSuggestionDto);
  }

  @Get()
  findAll(
    @Param('projectId') projectId: string,
    @Request() req
  ) {
    const userId = req.user.id || req.user._id || req.user.sub;
    return this.suggestionsService.findAllForProject(projectId, userId);
  }

  @Post(':id/upvote')
  upvote(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Request() req
  ) {
    const userId = req.user.id || req.user._id || req.user.sub;
    return this.suggestionsService.toggleUpvote(projectId, id, userId);
  }

  @Patch(':id')
  @UseInterceptors(TextModerationInterceptor)
  update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() updateSuggestionDto: UpdateSuggestionDto,
    @Request() req
  ) {
    const userId = req.user.id || req.user._id || req.user.sub;
    return this.suggestionsService.update(projectId, id, userId, updateSuggestionDto);
  }

  @Delete(':id')
  remove(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Request() req
  ) {
    const userId = req.user.id || req.user._id || req.user.sub;
    return this.suggestionsService.remove(projectId, id, userId);
  }
}
