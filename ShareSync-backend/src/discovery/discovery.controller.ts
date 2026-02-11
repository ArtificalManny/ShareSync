import { Controller, Get, Query } from '@nestjs/common';
import { DiscoveryService } from './discovery.service';

@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get()
  async getDiscoveryFeed(@Query() query: any) {
    return this.discoveryService.getDiscoveryFeed(query);
  }
}
