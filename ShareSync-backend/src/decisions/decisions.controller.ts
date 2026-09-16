import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import {
  JwtAuthGuard,
} from '../auth/jwt-auth.guard';

import {
  TextModerationInterceptor,
} from '../moderation/moderation.interceptor';

import {
  CreateDecisionDto,
} from './dto/create-decision.dto';

import {
  UpdateDecisionDto,
} from './dto/update-decision.dto';

import {
  DecisionsService,
} from './decisions.service';

@Controller(
  'projects/:projectId/decisions',
)
@UseGuards(JwtAuthGuard)
export class DecisionsController {
  constructor(
    private readonly decisionsService:
      DecisionsService,
  ) {}

  private getUserId(req: any) {
    return String(
      req?.user?.sub ||
        req?.user?.userId ||
        req?.user?._id ||
        req?.user?.id ||
        '',
    ).trim();
  }

  @Get()
  async findByProject(
    @Req() req: any,
    @Param('projectId')
    projectId: string,
  ) {
    const data =
      await this.decisionsService
        .findByProject(
          projectId,
          this.getUserId(req),
        );

    return {
      success: true,
      data,
    };
  }

  @Post()
  @UseInterceptors(
    TextModerationInterceptor,
  )
  async create(
    @Req() req: any,
    @Param('projectId')
    projectId: string,
    @Body()
    dto: CreateDecisionDto,
  ) {
    const data =
      await this.decisionsService.create(
        projectId,
        this.getUserId(req),
        dto,
      );

    return {
      success: true,
      data,
    };
  }

  @Patch(':decisionId')
  @UseInterceptors(
    TextModerationInterceptor,
  )
  async update(
    @Req() req: any,
    @Param('projectId')
    projectId: string,
    @Param('decisionId')
    decisionId: string,
    @Body()
    dto: UpdateDecisionDto,
  ) {
    const data =
      await this.decisionsService.update(
        projectId,
        decisionId,
        this.getUserId(req),
        dto,
      );

    return {
      success: true,
      data,
    };
  }
}
