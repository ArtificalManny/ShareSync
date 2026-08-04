import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
  CreateFlowRuleDto,
} from './dto/create-flow-rule.dto';
import {
  SetFlowRuleEnabledDto,
  UpdateFlowRuleDto,
} from './dto/update-flow-rule.dto';
import {
  FlowRulesService,
} from './flow-rules.service';

@ApiTags('Flow Rules')
@ApiBearerAuth()
@Controller('projects/:projectId/flow-rules')
@UseGuards(
  JwtAuthGuard,
  ProjectAccessGuard,
)
export class FlowRulesController {
  constructor(
    private readonly flowRulesService:
      FlowRulesService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List Flow Rules for a project',
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
    const rules =
      await this.flowRulesService.list(
        projectId,
      );

    return {
      success: true,
      data: rules,
    };
  }

  @Get(':ruleId')
  @ApiOperation({
    summary: 'Get one project Flow Rule',
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
      'ruleId',
      ParseObjectIdPipe,
    )
    ruleId: string,
  ) {
    const rule =
      await this.flowRulesService.findOne(
        projectId,
        ruleId,
      );

    return {
      success: true,
      data: rule,
    };
  }

  @Post()
  @ApiOperation({
    summary: 'Create a project Flow Rule',
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
    @Body() dto: CreateFlowRuleDto,
  ) {
    const rule =
      await this.flowRulesService.create(
        projectId,
        this.getUserId(req),
        dto,
      );

    return {
      success: true,
      data: rule,
    };
  }

  @Patch(':ruleId')
  @ApiOperation({
    summary: 'Update a project Flow Rule',
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
      'ruleId',
      ParseObjectIdPipe,
    )
    ruleId: string,
    @Body() dto: UpdateFlowRuleDto,
  ) {
    const rule =
      await this.flowRulesService.update(
        projectId,
        ruleId,
        this.getUserId(req),
        dto,
      );

    return {
      success: true,
      data: rule,
    };
  }

  @Patch(':ruleId/enabled')
  @ApiOperation({
    summary: 'Enable or disable a Flow Rule',
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
      'ruleId',
      ParseObjectIdPipe,
    )
    ruleId: string,
    @Body() dto: SetFlowRuleEnabledDto,
  ) {
    const rule =
      await this.flowRulesService.setEnabled(
        projectId,
        ruleId,
        this.getUserId(req),
        dto.enabled,
      );

    return {
      success: true,
      data: rule,
    };
  }

  @Delete(':ruleId')
  @ApiOperation({
    summary: 'Delete a project Flow Rule',
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
      'ruleId',
      ParseObjectIdPipe,
    )
    ruleId: string,
  ) {
    await this.flowRulesService.remove(
      projectId,
      ruleId,
    );

    return {
      success: true,
    };
  }

  private getUserId(req: any): string {
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
