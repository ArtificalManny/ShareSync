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
  CreateHandoffDto,
} from './dto/create-handoff.dto';

import {
  UpdateHandoffDto,
} from './dto/update-handoff.dto';

import {
  HandoffsService,
} from './handoffs.service';

@Controller(
  'projects/:projectId/handoffs',
)
@UseGuards(JwtAuthGuard)
export class HandoffsController {
  constructor(
    private readonly handoffsService:
      HandoffsService,
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
      await this.handoffsService
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
    dto: CreateHandoffDto,
  ) {
    const data =
      await this.handoffsService
        .create(
          projectId,
          this.getUserId(req),
          dto,
        );

    return {
      success: true,
      data,
    };
  }

  @Patch(':handoffId')
  @UseInterceptors(
    TextModerationInterceptor,
  )
  async update(
    @Req() req: any,
    @Param('projectId')
    projectId: string,
    @Param('handoffId')
    handoffId: string,
    @Body()
    dto: UpdateHandoffDto,
  ) {
    const data =
      await this.handoffsService
        .update(
          projectId,
          handoffId,
          this.getUserId(req),
          dto,
        );

    return {
      success: true,
      data,
    };
  }
}
