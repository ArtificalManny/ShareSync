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
  ProjectsModule,
} from '../projects/projects.module';
import {
  Project,
  ProjectSchema,
} from '../projects/schemas/project.schema';
import {
  TasksModule,
} from '../tasks/tasks.module';

import {
  IntakeFormsController,
} from './intake-forms.controller';
import {
  IntakeFormsService,
} from './intake-forms.service';
import {
  PublicIntakeFormsController,
} from './public-intake-forms.controller';
import {
  IntakeForm,
  IntakeFormSchema,
} from './schemas/intake-form.schema';
import {
  IntakeSubmission,
  IntakeSubmissionSchema,
} from './schemas/intake-submission.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: IntakeForm.name,
        schema: IntakeFormSchema,
      },
      {
        name: IntakeSubmission.name,
        schema:
          IntakeSubmissionSchema,
      },
      {
        name: Project.name,
        schema: ProjectSchema,
      },
    ]),
    ProjectsModule,
    TasksModule,
  ],
  controllers: [
    IntakeFormsController,
    PublicIntakeFormsController,
  ],
  providers: [
    IntakeFormsService,
    ProjectAccessGuard,
  ],
  exports: [
    IntakeFormsService,
  ],
})
export class IntakeFormsModule {}
