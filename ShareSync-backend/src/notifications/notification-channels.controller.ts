import { Body, Controller, Patch, Post, Param, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationChannelsService } from './notification-channels.service';

@Controller('notifications/channels')
export class NotificationChannelsController {
  constructor(private readonly svc: NotificationChannelsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('email/start')
  async startEmail(@Req() req: any, @Body() body: { email: string }) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;
    if (!userId) throw new BadRequestException('Missing user id');
    return this.svc.startEmailVerification({ userId, email: body?.email });
  }

  @UseGuards(JwtAuthGuard)
  @Post('email/verify')
  async verifyEmail(@Req() req: any, @Body() body: { email: string; code: string }) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;
    if (!userId) throw new BadRequestException('Missing user id');
    return this.svc.verifyCode({
      userId,
      channel: 'email',
      destination: body?.email,
      code: body?.code,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('sms/start')
  async startSms(@Req() req: any, @Body() body: { phoneNumber: string }) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;
    if (!userId) throw new BadRequestException('Missing user id');
    return this.svc.startSmsVerification({ userId, phoneNumber: body?.phoneNumber });
  }

  @UseGuards(JwtAuthGuard)
  @Post('sms/verify')
  async verifySms(@Req() req: any, @Body() body: { phoneNumber: string; code: string }) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;
    if (!userId) throw new BadRequestException('Missing user id');
    return this.svc.verifyCode({
      userId,
      channel: 'sms',
      destination: body?.phoneNumber,
      code: body?.code,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':channel/opt-in')
  async optIn(
    @Req() req: any,
    @Param('channel') channel: string,
    @Body() body: { optIn: boolean },
  ) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;
    if (!userId) throw new BadRequestException('Missing user id');

    if (channel !== 'email' && channel !== 'sms') {
      throw new BadRequestException('Channel must be email or sms');
    }

    return this.svc.setOptIn({
      userId,
      channel,
      optIn: Boolean(body?.optIn),
    });
  }
}
