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
  CreateCommitmentDto,
} from './dto/create-commitment.dto';

import {
  UpdateCommitmentDto,
} from './dto/update-commitment.dto';

import {
  CommitmentsService,
} from './commitments.service';

@Controller(
  'projects/:projectId/commitments',
)
@UseGuards(JwtAuthGuard)
export class CommitmentsController {
  constructor(
    private readonly commitmentsService:
      CommitmentsService,
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
      await this.commitmentsService
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
    dto: CreateCommitmentDto,
  ) {
    const data =
      await this.commitmentsService
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

  @Patch(':commitmentId')
  @UseInterceptors(
    TextModerationInterceptor,
  )
  async update(
    @Req() req: any,
    @Param('projectId')
    projectId: string,
    @Param('commitmentId')
    commitmentId: string,
    @Body()
    dto: UpdateCommitmentDto,
  ) {
    const data =
      await this.commitmentsService
        .update(
          projectId,
          commitmentId,
          this.getUserId(req),
          dto,
        );

    return {
      success: true,
      data,
    };
  }
}
