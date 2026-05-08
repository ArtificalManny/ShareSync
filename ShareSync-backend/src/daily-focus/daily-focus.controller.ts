import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DailyFocusService } from './daily-focus.service';

function getRequestUserId(req: any): string {
  return String(
    req?.user?.sub ||
      req?.user?.userId ||
      req?.user?.id ||
      req?.user?._id ||
      '',
  );
}

@UseGuards(JwtAuthGuard)
@Controller('daily-focus')
export class DailyFocusController {
  constructor(private readonly dailyFocusService: DailyFocusService) {}

  @Get('today')
  async getToday(@Req() req: any, @Query('timezone') timezone?: string) {
    const userId = getRequestUserId(req);

    return {
      success: true,
      data: await this.dailyFocusService.getToday(userId, timezone),
    };
  }

  @Post('today/accept')
  async acceptToday(
    @Req() req: any,
    @Body() body: { moveIds?: string[]; timezone?: string },
  ) {
    const userId = getRequestUserId(req);

    return {
      success: true,
      data: await this.dailyFocusService.acceptToday(
        userId,
        body?.moveIds || [],
        body?.timezone,
      ),
    };
  }

  @Post('today/moves')
  async addMove(
    @Req() req: any,
    @Body() body: { title?: string; projectId?: string; timezone?: string },
  ) {
    const userId = getRequestUserId(req);

    return {
      success: true,
      data: await this.dailyFocusService.addMove(userId, body, body?.timezone),
    };
  }

  @Patch('today/moves/:moveId')
  async updateMove(
    @Req() req: any,
    @Param('moveId') moveId: string,
    @Body() body: { title?: string; timezone?: string },
  ) {
    const userId = getRequestUserId(req);

    return {
      success: true,
      data: await this.dailyFocusService.updateMove(
        userId,
        moveId,
        body,
        body?.timezone,
      ),
    };
  }

  @Delete('today/moves/:moveId')
  async deleteMove(
    @Req() req: any,
    @Param('moveId') moveId: string,
    @Query('timezone') timezone?: string,
  ) {
    const userId = getRequestUserId(req);

    return {
      success: true,
      data: await this.dailyFocusService.deleteMove(userId, moveId, timezone),
    };
  }

  @Post('today/moves/:moveId/complete')
  async completeMove(
    @Req() req: any,
    @Param('moveId') moveId: string,
    @Body() body: { timezone?: string },
  ) {
    const userId = getRequestUserId(req);

    return {
      success: true,
      data: await this.dailyFocusService.completeMove(
        userId,
        moveId,
        body?.timezone,
      ),
    };
  }
}
