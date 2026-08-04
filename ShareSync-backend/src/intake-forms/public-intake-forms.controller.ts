import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  Throttle,
} from '@nestjs/throttler';

import {
  CreateIntakeSubmissionDto,
} from './dto/create-intake-submission.dto';
import {
  IntakeFormsService,
} from './intake-forms.service';

@ApiTags('Public Intake Forms')
@Controller('public/intake-forms')
export class PublicIntakeFormsController {
  constructor(
    private readonly intakeFormsService:
      IntakeFormsService,
  ) {}

  @Get(':slug')
  @Throttle({
    default: {
      limit: 60,
      ttl: 60000,
    },
  })
  @ApiOperation({
    summary:
      'Get an enabled public intake form',
  })
  async getForm(
    @Param('slug') slug: string,
  ) {
    return {
      success: true,
      data:
        await this.intakeFormsService
          .getPublicForm(slug),
    };
  }

  @Post(':slug/submissions')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({
    default: {
      limit: 10,
      ttl: 60000,
    },
  })
  @ApiOperation({
    summary:
      'Submit an enabled public intake form',
  })
  async submit(
    @Req() req: any,
    @Param('slug') slug: string,
    @Body()
    dto: CreateIntakeSubmissionDto,
  ) {
    return {
      success: true,
      data:
        await this.intakeFormsService
          .submitPublic(
            slug,
            dto,
            {
              userAgent:
                req?.get?.(
                  'user-agent',
                ) || '',
              referer:
                req?.get?.(
                  'referer',
                ) || '',
            },
          ),
    };
  }
}
