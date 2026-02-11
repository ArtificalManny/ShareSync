import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { DiscoveryController } from './discovery.controller';
import { DiscoveryService } from './discovery.service';

// ✅ IMPORTANT: update this import path to match your project schema file.
// Common patterns in your codebase might be:
//   ../projects/schemas/project.schema
//   ../projects/project.schema
//   ../projects/schemas/project.schema.ts
import { ProjectSchema } from '../projects/schemas/project.schema';

@Module({
  imports: [
    // ✅ This is what makes @InjectModel('Project') work in DiscoveryService
    MongooseModule.forFeature([{ name: 'Project', schema: ProjectSchema }]),
  ],
  controllers: [DiscoveryController],
  providers: [DiscoveryService],
})
export class DiscoveryModule {}
