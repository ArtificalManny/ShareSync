// src/feed/feed.module.ts
import { Module }          from '@nestjs/common';
import { FeedController }  from './feed.controller';

@Module({
  controllers: [FeedController],
})
export class FeedModule {}
