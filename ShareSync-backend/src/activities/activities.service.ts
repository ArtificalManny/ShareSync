// src/activities/activities.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { CreateActivityDto } from './dto/create-activity.dto';

// If you have a typed Activity interface/model, import it and replace AnyObj
type AnyObj = Record<string, any>;

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel('Activity')
    private readonly activityModel: Model<AnyObj>,
  ) {}

  /**
   * Create a new activity document.
   * Contract: (projectId, userId, dto)
   */
  async create(
    projectId: string,
    userId: string,
    dto: CreateActivityDto,
  ): Promise<AnyObj> {
    const now = new Date();

    const payload: AnyObj = {
      projectId,
      userId,
      type: dto.type ?? 'update',
      text: dto.text ?? '',
      meta: dto.meta ?? {},
      createdAt: now,
      updatedAt: now,
    };

    const doc = await this.activityModel.create(payload);
    return typeof (doc as any).toObject === 'function'
      ? (doc as any).toObject()
      : doc;
  }
}
