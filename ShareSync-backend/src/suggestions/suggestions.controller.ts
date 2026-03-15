import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  UseGuards, Request, BadRequestException,
} from '@nestjs/common';
import { SuggestionsService } from './suggestions.service';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { UpdateSuggestionDto } from './dto/update-suggestion.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('projects/:projectId/suggestions')
@UseGuards(JwtAuthGuard)
export class SuggestionsController {
  constructor(private readonly suggestionsService: SuggestionsService) {}

  @Post()
  create(
    @Param('projectId') projectId: string,
    @Body() createSuggestionDto: CreateSuggestionDto,
    @Request() req,
  ) {
    const userId = req.user.id || req.user._id || req.user.sub;
    return this.suggestionsService.create(projectId, userId, createSuggestionDto);
  }

  @Get()
  findAll(
    @Param('projectId') projectId: string,
    @Request() req,
  ) {
    const userId = req.user.id || req.user._id || req.user.sub;
    return this.suggestionsService.findAllForProject(projectId, userId);
  }

  @Patch(':id')
  update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() updateSuggestionDto: UpdateSuggestionDto,
    @Request() req,
  ) {
    const userId = req.user.id || req.user._id || req.user.sub;
    return this.suggestionsService.update(projectId, id, userId, updateSuggestionDto);
  }

  @Delete(':id')
  remove(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Request() req,
  ) {
    const userId = req.user.id || req.user._id || req.user.sub;
    return this.suggestionsService.remove(projectId, id, userId);
  }

  @Post(':id/upvote')
  async toggleUpvote(
    @Param('id') suggestionId: string,
    @Request() req,
  ) {
    const userId = req.user.id || req.user._id || req.user.sub;
    return this.suggestionsService.toggleUpvote(suggestionId, userId);
  }

  @Post(':id/comments')
  async addComment(
    @Param('id') suggestionId: string,
    @Body() body: { content: string },
    @Request() req,
  ) {
    const userId = req.user.id || req.user._id || req.user.sub;
    const content = body?.content?.trim();
    if (!content) throw new BadRequestException('Comment content is required');
    if (content.length > 1000) throw new BadRequestException('Comment cannot exceed 1000 characters');
    const authorName = [req.user?.firstName, req.user?.lastName].filter(Boolean).join(' ').trim() || req.user?.username || '';
    return this.suggestionsService.addComment(suggestionId, userId, content, authorName);
  }

  @Get(':id/comments')
  async getComments(@Param('id') suggestionId: string) {
    return this.suggestionsService.getComments(suggestionId);
  }
}
