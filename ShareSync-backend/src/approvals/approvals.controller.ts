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
  CreateApprovalDto,
} from './dto/create-approval.dto';

import {
  UpdateApprovalDto,
} from './dto/update-approval.dto';

import {
  ApprovalsService,
} from './approvals.service';

@Controller(
  'projects/:projectId/approvals',
)
@UseGuards(JwtAuthGuard)
export class ApprovalsController {
  constructor(
    private readonly approvalsService:
      ApprovalsService,
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
      await this.approvalsService
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
    dto: CreateApprovalDto,
  ) {
    const data =
      await this.approvalsService
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

  @Patch(':approvalId')
  @UseInterceptors(
    TextModerationInterceptor,
  )
  async update(
    @Req() req: any,
    @Param('projectId')
    projectId: string,
    @Param('approvalId')
    approvalId: string,
    @Body()
    dto: UpdateApprovalDto,
  ) {
    const data =
      await this.approvalsService
        .update(
          projectId,
          approvalId,
          this.getUserId(req),
          dto,
        );

    return {
      success: true,
      data,
    };
  }
}
