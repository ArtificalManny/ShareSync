// enterprise-sales-inquiry-backend-v1
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateEnterpriseInquiryDto } from './dto/create-enterprise-inquiry.dto';
import { SalesService } from './sales.service';

@ApiTags('Sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SalesController {
  constructor(
    private readonly salesService: SalesService,
  ) {}

  @Post('enterprise-inquiry')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({
    default: {
      limit: 5,
      ttl: 3600000,
    },
  })
  @ApiOperation({
    summary: 'Submit an Enterprise sales inquiry',
  })
  @ApiResponse({
    status: 201,
    description: 'Enterprise inquiry received',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many Enterprise inquiries',
  })
  async createEnterpriseInquiry(
    @Req() req: any,
    @Body() dto: CreateEnterpriseInquiryDto,
  ) {
    const userId = String(
      req.user?.userId ||
        req.user?.sub ||
        req.user?._id ||
        req.user?.id ||
        '',
    );

    const data =
      await this.salesService.createEnterpriseInquiry(
        userId,
        dto,
      );

    return {
      success: true,
      data,
    };
  }
}
