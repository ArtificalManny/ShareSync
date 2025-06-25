// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';   // you can leave or remove this
import { AppService } from './app.service';

// ← NEW imports
import { ProjectController } from './projects/project.controller';
import { FeedController    } from './feed/feed.controller';

@Module({
  imports: [],
  controllers: [
    AppController,       // optional
    ProjectController,   // ← our /api/projects
    FeedController,      // ← our /api/feed
  ],
  providers: [AppService],
})
export class AppModule {}
