import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { SuggestionsService } from './suggestions.service';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { UpdateSuggestionDto } from './dto/update-suggestion.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Adjust path if your auth guard is elsewhere

@Controller('api/projects/:projectId/suggestions')
@UseGuards(JwtAuthGuard)
export class SuggestionsController {
  constructor(private readonly suggestionsService: SuggestionsService) {}

  @Post()
  create(
    @Param('projectId') projectId: string,
    @Body() createSuggestionDto: CreateSuggestionDto,
    @Request() req
  ) {
    const userId = req.user.id || req.user._id;
    return this.suggestionsService.create(projectId, userId, createSuggestionDto);
  }

  @Get()
  findAll(
    @Param('projectId') projectId: string,
    @Request() req
  ) {
    const userId = req.user.id || req.user._id;
    return this.suggestionsService.findAllForProject(projectId, userId);
  }

  @Patch(':id')
  update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() updateSuggestionDto: UpdateSuggestionDto,
    @Request() req
  ) {
    const userId = req.user.id || req.user._id;
    return this.suggestionsService.update(projectId, id, userId, updateSuggestionDto);
  }

  @Delete(':id')
  remove(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Request() req
  ) {
    const userId = req.user.id || req.user._id;
    return this.suggestionsService.remove(projectId, id, userId);
  }
}
