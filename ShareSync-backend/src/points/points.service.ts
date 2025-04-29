import { Injectable } from '@nestjs/common';

@Injectable()
export class PointsService {
  // Example implementation of getPoints
  async getPoints(): Promise<any> {
    return { points: 100 }; // Replace with actual logic if needed
  }
}