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
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import {
  JwtAuthGuard,
} from '../auth/jwt-auth.guard';
import {
  ProjectAccess,
  ProjectAccessGuard,
} from '../common/guards/project-access.guard';
import {
  ParseObjectIdPipe,
} from '../common/pipes/parse-objectid.pipe';

import {
  CreateIntakeFormDto,
} from './dto/create-intake-form.dto';
import {
  ConvertIntakeSubmissionDto,
  UpdateIntakeSubmissionStatusDto,
} from './dto/update-intake-submission.dto';
import {
  SetIntakeFormEnabledDto,
  UpdateIntakeFormDto,
} from './dto/update-intake-form.dto';
import {
  IntakeFormsService,
} from './intake-forms.service';
import {
  IntakeSubmissionStatus,
} from './schemas/intake-submission.schema';

@ApiTags('Intake Forms')
@ApiBearerAuth()
@Controller(
  'projects/:projectId/intake-forms',
)
@UseGuards(
  JwtAuthGuard,
  ProjectAccessGuard,
)
export class IntakeFormsController {
  constructor(
    private readonly intakeFormsService:
      IntakeFormsService,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'List intake forms for a project',
  })
  @ProjectAccess({
    param: 'projectId',
    intent: 'read',
  })
  async list(
    @Param(
      'projectId',
      ParseObjectIdPipe,
    )
    projectId: string,
  ) {
    return {
      success: true,
      data:
        await this.intakeFormsService
          .list(projectId),
    };
  }

  @Post()
  @ApiOperation({
    summary:
      'Create a project intake form',
  })
  @ProjectAccess({
    param: 'projectId',
    intent: 'write',
    roles: ['owner', 'admin'],
  })
  async create(
    @Req() req: any,
    @Param(
      'projectId',
      ParseObjectIdPipe,
    )
    projectId: string,
    @Body()
    dto: CreateIntakeFormDto,
  ) {
    return {
      success: true,
      data:
        await this.intakeFormsService
          .create(
            projectId,
            this.getUserId(req),
            dto,
          ),
    };
  }

  @Get(':formId/submissions')
  @ApiOperation({
    summary:
      'List submissions for an intake form',
  })
  @ProjectAccess({
    param: 'projectId',
    intent: 'read',
  })
  async listSubmissions(
    @Param(
      'projectId',
      ParseObjectIdPipe,
    )
    projectId: string,
    @Param(
      'formId',
      ParseObjectIdPipe,
    )
    formId: string,
    @Query('status')
    status?: IntakeSubmissionStatus,
  ) {
    return {
      success: true,
      data:
        await this.intakeFormsService
          .listSubmissions(
            projectId,
            formId,
            status,
          ),
    };
  }

  @Get(
    ':formId/submissions/:submissionId',
  )
  @ApiOperation({
    summary:
      'Get one intake submission',
  })
  @ProjectAccess({
    param: 'projectId',
    intent: 'read',
  })
  async findSubmission(
    @Param(
      'projectId',
      ParseObjectIdPipe,
    )
    projectId: string,
    @Param(
      'formId',
      ParseObjectIdPipe,
    )
    formId: string,
    @Param(
      'submissionId',
      ParseObjectIdPipe,
    )
    submissionId: string,
  ) {
    return {
      success: true,
      data:
        await this.intakeFormsService
          .findSubmission(
            projectId,
            formId,
            submissionId,
          ),
    };
  }

  @Patch(
    ':formId/submissions/:submissionId/status',
  )
  @ApiOperation({
    summary:
      'Update an intake submission status',
  })
  @ProjectAccess({
    param: 'projectId',
    intent: 'write',
    roles: ['owner', 'admin'],
  })
  async updateSubmissionStatus(
    @Param(
      'projectId',
      ParseObjectIdPipe,
    )
    projectId: string,
    @Param(
      'formId',
      ParseObjectIdPipe,
    )
    formId: string,
    @Param(
      'submissionId',
      ParseObjectIdPipe,
    )
    submissionId: string,
    @Body()
    dto:
      UpdateIntakeSubmissionStatusDto,
  ) {
    return {
      success: true,
      data:
        await this.intakeFormsService
          .updateSubmissionStatus(
            projectId,
            formId,
            submissionId,
            dto,
          ),
    };
  }

  @Post(
    ':formId/submissions/:submissionId/convert',
  )
  @ApiOperation({
    summary:
      'Convert an intake submission into a Move',
  })
  @ProjectAccess({
    param: 'projectId',
    intent: 'write',
    roles: ['owner', 'admin'],
  })
  async convertSubmission(
    @Req() req: any,
    @Param(
      'projectId',
      ParseObjectIdPipe,
    )
    projectId: string,
    @Param(
      'formId',
      ParseObjectIdPipe,
    )
    formId: string,
    @Param(
      'submissionId',
      ParseObjectIdPipe,
    )
    submissionId: string,
    @Body()
    dto: ConvertIntakeSubmissionDto,
  ) {
    return {
      success: true,
      data:
        await this.intakeFormsService
          .convertSubmissionToMove(
            projectId,
            formId,
            submissionId,
            this.getUserId(req),
            dto,
          ),
    };
  }

  @Get(':formId')
  @ApiOperation({
    summary:
      'Get one project intake form',
  })
  @ProjectAccess({
    param: 'projectId',
    intent: 'read',
  })
  async findOne(
    @Param(
      'projectId',
      ParseObjectIdPipe,
    )
    projectId: string,
    @Param(
      'formId',
      ParseObjectIdPipe,
    )
    formId: string,
  ) {
    return {
      success: true,
      data:
        await this.intakeFormsService
          .findOne(
            projectId,
            formId,
          ),
    };
  }

  @Patch(':formId')
  @ApiOperation({
    summary:
      'Update a project intake form',
  })
  @ProjectAccess({
    param: 'projectId',
    intent: 'write',
    roles: ['owner', 'admin'],
  })
  async update(
    @Req() req: any,
    @Param(
      'projectId',
      ParseObjectIdPipe,
    )
    projectId: string,
    @Param(
      'formId',
      ParseObjectIdPipe,
    )
    formId: string,
    @Body()
    dto: UpdateIntakeFormDto,
  ) {
    return {
      success: true,
      data:
        await this.intakeFormsService
          .update(
            projectId,
            formId,
            this.getUserId(req),
            dto,
          ),
    };
  }

  @Patch(':formId/enabled')
  @ApiOperation({
    summary:
      'Enable or disable an intake form',
  })
  @ProjectAccess({
    param: 'projectId',
    intent: 'write',
    roles: ['owner', 'admin'],
  })
  async setEnabled(
    @Req() req: any,
    @Param(
      'projectId',
      ParseObjectIdPipe,
    )
    projectId: string,
    @Param(
      'formId',
      ParseObjectIdPipe,
    )
    formId: string,
    @Body()
    dto: SetIntakeFormEnabledDto,
  ) {
    return {
      success: true,
      data:
        await this.intakeFormsService
          .setEnabled(
            projectId,
            formId,
            this.getUserId(req),
            dto.enabled,
          ),
    };
  }

  @Delete(':formId')
  @ApiOperation({
    summary:
      'Delete an intake form and its submissions',
  })
  @ProjectAccess({
    param: 'projectId',
    intent: 'write',
    roles: ['owner', 'admin'],
  })
  async remove(
    @Param(
      'projectId',
      ParseObjectIdPipe,
    )
    projectId: string,
    @Param(
      'formId',
      ParseObjectIdPipe,
    )
    formId: string,
  ) {
    await this.intakeFormsService
      .remove(
        projectId,
        formId,
      );

    return {
      success: true,
    };
  }

  private getUserId(req: any) {
    const userId =
      req?.user?.sub ||
      req?.user?.userId ||
      req?.user?.id ||
      req?.user?._id;

    if (!userId) {
      throw new UnauthorizedException(
        'Authenticated user ID is missing.',
      );
    }

    return String(userId);
  }
}
