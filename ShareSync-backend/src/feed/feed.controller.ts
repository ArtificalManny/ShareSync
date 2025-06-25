import { Controller, Get } from '@nestjs/common';

@Controller('feed')
export class FeedController {
  @Get()
  findAll() {
    return []; // stub data
  }
}
