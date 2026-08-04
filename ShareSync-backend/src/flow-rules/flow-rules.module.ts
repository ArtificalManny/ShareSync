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
  NotificationsModule,
} from '../notifications/notifications.module';
import {
  Project,
  ProjectSchema,
} from '../projects/schemas/project.schema';
import {
  TasksModule,
} from '../tasks/tasks.module';

import {
  FlowRuleActionExecutor,
} from './flow-rule-action.executor';
import {
  FlowRuleMatcher,
} from './flow-rule.matcher';
import {
  FlowRulesController,
} from './flow-rules.controller';
import {
  FlowRulesService,
} from './flow-rules.service';
import {
  FlowRuleTaskListener,
} from './listeners/flow-rule-task.listener';
import {
  FlowRuleExecution,
  FlowRuleExecutionSchema,
} from './schemas/flow-rule-execution.schema';
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
        name: FlowRuleExecution.name,
        schema: FlowRuleExecutionSchema,
      },
      {
        name: Project.name,
        schema: ProjectSchema,
      },
    ]),
    TasksModule,
    NotificationsModule,
  ],
  controllers: [
    FlowRulesController,
  ],
  providers: [
    FlowRulesService,
    FlowRuleMatcher,
    FlowRuleActionExecutor,
    FlowRuleTaskListener,
    ProjectAccessGuard,
  ],
  exports: [
    FlowRulesService,
  ],
})
export class FlowRulesModule {}
