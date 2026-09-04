import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SponsorshipsService } from './sponsorships.service';

@ApiTags('Sponsorships')
@Controller('sponsorships')
export class SponsorshipsController {
  constructor(
    private readonly sponsorshipsService: SponsorshipsService,
  ) {}

  @Get('active')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Get active contextual sponsorship for current user',
  })
  @ApiQuery({
    name: 'placement',
    required: false,
    type: String,
  })
  async getActive(
    @Req() req: any,
    @Query('placement')
    placement = 'discover_sidebar',
  ) {
    const userId =
      req.user?.sub || req.user?.userId;

    return this.sponsorshipsService.getActiveCampaign(
      userId,
      placement,
    );
  }

  @Post(':campaignId/impression')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Record one visible sponsorship impression',
  })
  async recordImpression(
    @Req() req: any,
    @Param('campaignId') campaignId: string,
    @Body()
    body: {
      placement?: string;
    },
  ) {
    const userId =
      req.user?.sub || req.user?.userId;

    return this.sponsorshipsService.recordEvent(
      userId,
      campaignId,
      'impression',
      body?.placement,
    );
  }

  @Post(':campaignId/click')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Record one sponsorship click',
  })
  async recordClick(
    @Req() req: any,
    @Param('campaignId') campaignId: string,
    @Body()
    body: {
      placement?: string;
    },
  ) {
    const userId =
      req.user?.sub || req.user?.userId;

    return this.sponsorshipsService.recordEvent(
      userId,
      campaignId,
      'click',
      body?.placement,
    );
  }
}
