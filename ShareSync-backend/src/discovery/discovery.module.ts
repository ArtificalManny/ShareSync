import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { DiscoveryController } from './discovery.controller';
import { DiscoveryService } from './discovery.service';

import { ProjectSchema } from '../projects/schemas/project.schema';
// ⭐ UPGRADE: Item 8 - Import SuggestionSchema for Dasgupta Social Proof calculation
import { SuggestionSchema } from '../suggestions/schemas/suggestion.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Project', schema: ProjectSchema },
      { name: 'Suggestion', schema: SuggestionSchema }
    ]),
  ],
  controllers: [DiscoveryController],
  providers: [DiscoveryService],
})
export class DiscoveryModule {}
