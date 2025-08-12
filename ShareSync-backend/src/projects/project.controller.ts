import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/projects')
export class ProjectController {
  constructor(@InjectModel('Project') private readonly Project: Model<any>) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: any, @Req() req: any) {
    const doc = await this.Project.create({
      title: dto.title,
      description: dto.description,
      category: dto.category ?? '',
      status: dto.status ?? 'Not Started',
      privacy: dto.privacy ?? 'Private',
      members: Array.isArray(dto.members) ? dto.members : [],
      ownerId: req.user?.userId ?? null,
    });
    return doc; // includes _id
  }
}
