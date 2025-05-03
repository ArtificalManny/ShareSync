import { Injectable } from '@nestjs/common';

@Injectable()
export class PointsService {
  async getPoints(): Promise<any> {
    return { points: 100 }; // Example implementation
  }
}