import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
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
  AsyncCheckInsService,
} from './async-check-ins.service';

import {
  CreateAsyncCheckInDto,
} from './dto/create-async-check-in.dto';

import {
  UpdateAsyncCheckInDto,
} from './dto/update-async-check-in.dto';

import {
  UpsertAsyncCheckInResponseDto,
} from './dto/upsert-async-check-in-response.dto';

@Controller(
  'projects/:projectId/check-ins',
)
@UseGuards(JwtAuthGuard)
export class AsyncCheckInsController {
  constructor(
    private readonly asyncCheckInsService:
      AsyncCheckInsService,
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
      await this.asyncCheckInsService
        .findByProject(
          projectId,
          this.getUserId(req),
        );

    return {
      success: true,
      data,
    };
  }

  @Get(':checkInId')
  async findOne(
    @Req() req: any,
    @Param('projectId')
    projectId: string,
    @Param('checkInId')
    checkInId: string,
  ) {
    const data =
      await this.asyncCheckInsService
        .findOne(
          projectId,
          checkInId,
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
    dto: CreateAsyncCheckInDto,
  ) {
    const data =
      await this.asyncCheckInsService
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

  @Patch(':checkInId')
  @UseInterceptors(
    TextModerationInterceptor,
  )
  async update(
    @Req() req: any,
    @Param('projectId')
    projectId: string,
    @Param('checkInId')
    checkInId: string,
    @Body()
    dto: UpdateAsyncCheckInDto,
  ) {
    const data =
      await this.asyncCheckInsService
        .update(
          projectId,
          checkInId,
          this.getUserId(req),
          dto,
        );

    return {
      success: true,
      data,
    };
  }

  @Put(':checkInId/response')
  @UseInterceptors(
    TextModerationInterceptor,
  )
  async upsertMyResponse(
    @Req() req: any,
    @Param('projectId')
    projectId: string,
    @Param('checkInId')
    checkInId: string,
    @Body()
    dto: UpsertAsyncCheckInResponseDto,
  ) {
    const data =
      await this.asyncCheckInsService
        .upsertMyResponse(
          projectId,
          checkInId,
          this.getUserId(req),
          dto,
        );

    return {
      success: true,
      data,
    };
  }
}
