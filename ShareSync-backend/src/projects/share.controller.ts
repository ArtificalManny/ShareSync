import {
  Controller,
  Post,
  Get,
  Param,
  Req,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectService } from './project.service';  // FIXED

@Controller('public/projects')
export class ProjectShareController {
  constructor(private readonly projects: ProjectService) {}  // FIXED

  @Post(':id/enable')
  @UseGuards(JwtAuthGuard)
  async enable(@Req() req, @Param('id') id: string) {
    const userId = req?.user?.sub;
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    const { publicToken } = await this.projects.enablePublic(id, userId);
    return { token: publicToken };
  }

  @Post(':id/disable')
  @UseGuards(JwtAuthGuard)
  async disable(@Req() req, @Param('id') id: string) {
    const userId = req?.user?.sub;
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    await this.projects.disablePublic(id, userId);
    return { ok: true };
  }

  @Post(':id/regenerate')
  @UseGuards(JwtAuthGuard)
  async regenerate(@Req() req, @Param('id') id: string) {
    const userId = req?.user?.sub;
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    const { publicToken } = await this.projects.regeneratePublicToken(id, userId);
    return { token: publicToken };
  }

  @Get(':token/status')
  async status(@Param('token') token: string) {
    const snap = await this.projects.getPublicSnapshotByToken(token);
    if (!snap) {
      throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    }
    return snap;
  }
}