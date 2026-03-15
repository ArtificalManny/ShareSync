
import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';

import { SuggestionsService } from './suggestions.service';

import { SuggestionsController } from './suggestions.controller';

import { Suggestion, SuggestionSchema } from './schemas/suggestion.schema';

import { Project, ProjectSchema } from '../projects/schemas/project.schema';

 

@Module({

  imports: [

    MongooseModule.forFeature([

      { name: Suggestion.name, schema: SuggestionSchema },

      { name: Project.name, schema: ProjectSchema },

    ]),

  ],

  controllers: [SuggestionsController],

  providers: [SuggestionsService],

  exports: [SuggestionsService],

})

export class SuggestionsModule {}

