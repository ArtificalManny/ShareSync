import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountEnforcementService } from './account-enforcement.service';
import { AdminGuard } from './admin.guard';
import {
  EnforcementReasonDto,
  UpdateAccountStatusDto,
} from './dto/update-account-status.dto';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AccountEnforcementController {
  constructor(
    private readonly enforcementService: AccountEnforcementService,
  ) {}

  @Get(':userId/enforcement')
  getStatus(@Param('userId') userId: string) {
    return this.enforcementService.getStatus(userId);
  }

  @Patch(':userId/status')
  updateStatus(
    @Param('userId') userId: string,
    @Body() dto: UpdateAccountStatusDto,
    @Req() req: any,
  ) {
    return this.enforcementService.updateStatus(
      userId,
      dto,
      this.getActorId(req),
    );
  }

  @Post(':userId/warn')
  warn(
    @Param('userId') userId: string,
    @Body() dto: EnforcementReasonDto,
    @Req() req: any,
  ) {
    return this.enforcementService.warn(userId, dto, this.getActorId(req));
  }

  @Post(':userId/suspend')
  suspend(
    @Param('userId') userId: string,
    @Body() dto: EnforcementReasonDto,
    @Req() req: any,
  ) {
    return this.enforcementService.suspend(userId, dto, this.getActorId(req));
  }

  @Post(':userId/disable')
  disable(
    @Param('userId') userId: string,
    @Body() dto: EnforcementReasonDto,
    @Req() req: any,
  ) {
    return this.enforcementService.disable(userId, dto, this.getActorId(req));
  }

  @Post(':userId/ban')
  ban(
    @Param('userId') userId: string,
    @Body() dto: EnforcementReasonDto,
    @Req() req: any,
  ) {
    return this.enforcementService.ban(userId, dto, this.getActorId(req));
  }

  @Post(':userId/restore')
  restore(
    @Param('userId') userId: string,
    @Body() dto: EnforcementReasonDto,
    @Req() req: any,
  ) {
    return this.enforcementService.restore(userId, dto, this.getActorId(req));
  }

  private getActorId(req: any): string {
    return String(
      req?.user?._id ||
      req?.user?.userId ||
      req?.user?.id ||
      req?.user?.sub ||
      '',
    );
  }
}
