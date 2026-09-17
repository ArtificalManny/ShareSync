import {
  Module,
} from '@nestjs/common';

import {
  MongooseModule,
} from '@nestjs/mongoose';

import {
  ModerationModule,
} from '../moderation/moderation.module';

import {
  ProjectsModule,
} from '../projects/projects.module';

import {
  ResponsibilityMapController,
} from './responsibility-map.controller';

import {
  ResponsibilityMapService,
} from './responsibility-map.service';

import {
  Responsibility,
  ResponsibilitySchema,
} from './schemas/responsibility.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Responsibility.name,
        schema: ResponsibilitySchema,
      },
    ]),
    ProjectsModule,
    ModerationModule,
  ],
  controllers: [
    ResponsibilityMapController,
  ],
  providers: [
    ResponsibilityMapService,
  ],
  exports: [
    ResponsibilityMapService,
  ],
})
export class ResponsibilityMapModule {}
