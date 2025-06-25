// src/feed/feed.controller.ts
import { Controller, Get } from '@nestjs/common';

@Controller('feed')
export class FeedController {
  @Get()
  findAll() {
    // for now, just return an empty array
    return [];
  }
}
