import { Controller, Get, Req, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MyWorkService } from './my-work.service';

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
@Controller('my-work')
export class MyWorkController {
  constructor(private readonly myWorkService: MyWorkService) {}

  @Get()
  async getMyWork(@Req() req: any) {
    return {
      success: true,
      data: await this.myWorkService.getForUser(
        getRequestUserId(req),
      ),
    };
  }
}
