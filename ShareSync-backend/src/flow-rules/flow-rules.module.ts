import {
  Module,
} from '@nestjs/common';
import {
  MongooseModule,
} from '@nestjs/mongoose';

import {
  ProjectAccessGuard,
} from '../common/guards/project-access.guard';
import {
  Project,
  ProjectSchema,
} from '../projects/schemas/project.schema';

import {
  FlowRulesController,
} from './flow-rules.controller';
import {
  FlowRulesService,
} from './flow-rules.service';
import {
  FlowRule,
  FlowRuleSchema,
} from './schemas/flow-rule.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: FlowRule.name,
        schema: FlowRuleSchema,
      },
      {
        name: Project.name,
        schema: ProjectSchema,
      },
    ]),
  ],
  controllers: [
    FlowRulesController,
  ],
  providers: [
    FlowRulesService,
    ProjectAccessGuard,
  ],
  exports: [
    FlowRulesService,
  ],
})
export class FlowRulesModule {}
