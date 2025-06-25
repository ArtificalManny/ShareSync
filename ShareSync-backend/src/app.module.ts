import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService }    from './app.service';

import { ProjectController } from './projects/project.controller';
import { FeedController    } from './feed/feed.controller';

@Module({
  imports: [],
  controllers: [
    AppController,       // you can remove if unused
    ProjectController,   // ← serves GET /api/projects
    FeedController,      // ← serves GET /api/feed
  ],
  providers: [AppService],
})
export class AppModule {}
