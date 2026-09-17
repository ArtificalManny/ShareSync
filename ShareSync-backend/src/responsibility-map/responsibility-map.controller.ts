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
  CreateResponsibilityDto,
} from './dto/create-responsibility.dto';

import {
  UpdateResponsibilityDto,
} from './dto/update-responsibility.dto';

import {
  ResponsibilityMapService,
} from './responsibility-map.service';

@Controller(
  'projects/:projectId/responsibility-map',
)
@UseGuards(JwtAuthGuard)
export class ResponsibilityMapController {
  constructor(
    private readonly responsibilityMapService:
      ResponsibilityMapService,
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
      await this.responsibilityMapService
        .findByProject(
          projectId,
          this.getUserId(req),
        );

    return {
      success: true,
      data,
    };
  }

  @Get(':responsibilityId')
  async findOne(
    @Req() req: any,
    @Param('projectId')
    projectId: string,
    @Param('responsibilityId')
    responsibilityId: string,
  ) {
    const data =
      await this.responsibilityMapService
        .findOne(
          projectId,
          responsibilityId,
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
    dto: CreateResponsibilityDto,
  ) {
    const data =
      await this.responsibilityMapService
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

  @Patch(':responsibilityId')
  @UseInterceptors(
    TextModerationInterceptor,
  )
  async update(
    @Req() req: any,
    @Param('projectId')
    projectId: string,
    @Param('responsibilityId')
    responsibilityId: string,
    @Body()
    dto: UpdateResponsibilityDto,
  ) {
    const data =
      await this.responsibilityMapService
        .update(
          projectId,
          responsibilityId,
          this.getUserId(req),
          dto,
        );

    return {
      success: true,
      data,
    };
  }
}
